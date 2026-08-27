import { NextRequest, NextResponse } from 'next/server';
import { AzureDevOpsService, DevOpsApiError, workItemToTicket } from '@/lib/devops';
import { requirePermission, isAuthed } from '@/lib/api-auth';
import { isEmailTicket, extractRequesterEmail, sendStatusChangeNotification } from '@/lib/email';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requirePermission('tickets:change_status');
    if (!isAuthed(auth)) return auth;
    const { session } = auth;

    const { id } = await params;
    const ticketId = parseInt(id, 10);

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    const body = await request.json();
    const { state } = body;

    if (!state) {
      return NextResponse.json({ error: 'State is required' }, { status: 400 });
    }

    const organization = request.headers.get('x-devops-org') || undefined;
    const devopsService = new AzureDevOpsService(session.accessToken!, organization);

    // If project is provided in the body, use it directly
    if (body.project) {
      // Snapshot old state first so the email shows the transition.
      let oldState: string | undefined;
      try {
        const existing = await devopsService.getWorkItem(body.project, ticketId);
        oldState = existing?.fields?.['System.State'];
      } catch {
        // Continue without old state — the transition message will say "Unknown".
      }

      const updatedWorkItem = await devopsService.updateTicketState(body.project, ticketId, state);
      notifyStateChange(updatedWorkItem, ticketId, oldState || 'Unknown', state);
      const ticket = workItemToTicket(updatedWorkItem);
      return NextResponse.json({ ticket });
    }

    // Fallback: search all projects to find the ticket
    const projects = await devopsService.getProjects();

    for (const project of projects) {
      let workItem;
      try {
        workItem = await devopsService.getWorkItem(project.name, ticketId);
      } catch (lookupError) {
        // Only a genuine 404 means "not in this project" — 401/429/5xx are
        // real failures and must not be reported as a missing ticket. The
        // update below never falls through here either, or a rejected
        // transition would surface as "Ticket not found" (issue #391).
        if (lookupError instanceof DevOpsApiError && lookupError.status === 404) continue;
        throw lookupError;
      }
      if (!workItem) continue;

      const oldState = workItem.fields?.['System.State'] || 'Unknown';

      const updatedWorkItem = await devopsService.updateTicketState(project.name, ticketId, state);

      notifyStateChange(updatedWorkItem, ticketId, oldState, state);

      const ticket = workItemToTicket(updatedWorkItem, {
        id: project.id,
        name: project.name,
        devOpsProject: project.name,
        devOpsOrg: organization || '',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json({ ticket });
    }

    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  } catch (error) {
    console.error('Error updating ticket state:', error);
    // Pass through the upstream message for blocked state transitions and
    // similar workflow errors — collapsing everything to a generic 500
    // means the UI can't tell the user *why* the drag failed (issue #391).
    if (error instanceof DevOpsApiError) {
      // 400/409 are workflow rejections; 401/403/404 are auth, permission and
      // missing-item failures the client can act on — anything else is genuinely
      // ours to own, so it stays a 500.
      const passThrough = [400, 401, 403, 404, 409];
      const status = passThrough.includes(error.status) ? error.status : 500;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'Failed to update ticket state' }, { status: 500 });
  }
}

/** Fire-and-forget email notification for state changes on email-created tickets. */
function notifyStateChange(
  workItem: { fields?: Record<string, unknown> },
  ticketId: number,
  oldState: string,
  newState: string
) {
  const tags = String(workItem.fields?.['System.Tags'] || '');
  if (!isEmailTicket(tags)) return;

  const requesterEmail = extractRequesterEmail(tags);
  if (!requesterEmail) return;

  const subject = String(workItem.fields?.['System.Title'] || 'Your ticket');
  sendStatusChangeNotification(ticketId, subject, requesterEmail, oldState, newState).catch(
    () => {}
  );
}
