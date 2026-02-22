import { EditAdminForm } from "@/components/admins/edit/EditForm";

interface EditAgentFormProps {
  agentId: string;
  viewOnly?: boolean;
}

export function EditAgentForm({ agentId, viewOnly = false }: EditAgentFormProps) {
  return <EditAdminForm adminId={agentId} profileMode="agent" viewOnly={viewOnly} />;
}
