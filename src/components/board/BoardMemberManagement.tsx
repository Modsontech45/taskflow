import React, { useState } from "react";
import { apiClient } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useToast } from "../ui/Toast";
import { Board, BoardMember } from "../../types/board";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Card, CardContent, CardHeader } from "../ui/Card";
import {
  Users,
  Plus,
  Crown,
  Edit3,
  Eye,
  Trash2,
  Mail,
  UserPlus,
} from "lucide-react";

interface BoardMemberManagementProps {
  board: Board;
  onMembersUpdate: (members: BoardMember[]) => void;
}

interface MemberResponse {
  id: string;
  userId: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function BoardMemberManagement({
  board,
  onMembersUpdate,
}: BoardMemberManagementProps) {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const { showToast } = useToast();

  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"EDITOR" | "VIEWER">(
    "EDITOR"
  );
  const [loading, setLoading] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const isOwner = board.ownerId === user?.id;
  const canManageMembers = isOwner;

  const roleIcons = { OWNER: Crown, EDITOR: Edit3, VIEWER: Eye };
  const roleColors = {
    OWNER: "text-yellow-600 bg-yellow-100",
    EDITOR: "text-blue-600 bg-blue-100",
    VIEWER: "text-gray-600 bg-gray-100",
  };
  const roleDescriptions = {
    OWNER: "Full access - can manage board and members",
    EDITOR: "Can create, edit, and delete tasks",
    VIEWER: "Can only view tasks and board content",
  };

  const getInitials = (m: BoardMember) => {
    const f = m.firstName?.trim() || "";
    const l = m.lastName?.trim() || "";
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    if (f) return f[0].toUpperCase();
    if (l) return l[0].toUpperCase();
    return "U";
  };

  // ---------------- Add Member ----------------
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Add Member Form Submitted:", { newMemberEmail, newMemberRole });

    if (!newMemberEmail.trim()) {
      showToast("error", "Email required", "Please enter a valid email address.");
      console.warn("Add Member failed: email empty");
      return;
    }

    if ((board.members || []).some((m) => m.email === newMemberEmail.trim())) {
      showToast("warning", "Already a member", "This user is already on the board.");
      console.warn("Add Member failed: user already a member");
      return;
    }

    setLoading(true);
    try {
      console.log("Calling API to add member...");
      const memberData = (await apiClient.addMember({
        boardId: board.id,
        userId: newMemberEmail.trim(),
        role: newMemberRole,
      })) as MemberResponse;
      console.log("API Response:", memberData);

      const newMember: BoardMember = {
        userId: memberData.userId,
        role: memberData.role,
        user: { ...memberData.user },
      };

      const updatedMembers = [...(board.members || []), newMember];
      console.log("Updated Members Array:", updatedMembers);

      onMembersUpdate(updatedMembers);
      setAddMemberModalOpen(false);
      setNewMemberEmail("");
      setNewMemberRole("EDITOR");

      showToast("success", "Member added", "The user has been added to the board.");

      try {
        console.log("Creating notification for invited member...");
        await createNotification(
          "MEMBER_INVITED",
          "New member invited",
          `${memberData.user.firstName} ${memberData.user.lastName} was invited to board "${board.name}"`,
          { boardId: board.id, memberId: memberData.userId }
        );
      } catch (notifErr) {
        console.warn("Failed to create invite notification", notifErr);
      }
    } catch (error: any) {
      console.error("Error adding member:", error);
      showToast("error", "Failed to add member", error?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Update Member Role ----------------
  const handleUpdateMemberRole = async (userId: string, newRole: "EDITOR" | "VIEWER") => {
    console.log("Updating member role:", { userId, newRole });
    setUpdatingMemberId(userId);
    const previous = board.members || [];
    onMembersUpdate(previous.map((m) => (m.userId === userId ? { ...m, role: newRole } : m)));

    try {
      await apiClient.updateMember({ boardId: board.id, userId, role: newRole });
      console.log("Member role updated successfully for:", userId);
      showToast("success", "Role updated", "Member role has been updated successfully.");
    } catch (error: any) {
      onMembersUpdate(previous);
      console.error("Error updating member role:", error);
      showToast("error", "Failed to update role", error?.message || "Please try again.");
    } finally {
      setUpdatingMemberId(null);
    }
  };

  // ---------------- Remove Member ----------------
  const handleRemoveMemberConfirmed = async (id: string) => {
    console.log("Removing member:", id);
    setRemovingMemberId(id);
    const previous = board.members || [];
    onMembersUpdate(previous.filter((m) => m.userId !== id));

    try {
      await apiClient.removeMember({ boardId: board.id, userId: id });
      console.log("Member removed successfully:", id);
      showToast("success", "Member removed", "The member has been removed from the board.");
    } catch (error: any) {
      onMembersUpdate(previous);
      console.error("Error removing member:", error);
      showToast("error", "Failed to remove member", error?.message || "Please try again.");
    } finally {
      setRemovingMemberId(null);
      setRemoveConfirm(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Board Members</h3>
            <span className="text-sm text-gray-500">({board.members?.length || 0})</span>
          </div>
          {canManageMembers && (
            <Button onClick={() => setAddMemberModalOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" /> Add Member
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!board.members?.length && (
          <div className="py-6 text-center text-sm text-gray-500">
            No members yet. Invite someone to collaborate on this board.
          </div>
        )}

        <div className="space-y-3">
          {board.members?.map((member) => {
            const RoleIcon = roleIcons[member.role || "VIEWER"]; // fallback to VIEWER

            const isCurrentUser = member.id === user?.id;
            const bgClass = roleColors[member.role]?.split(" ")[0] || "bg-gray-500";

            console.log("Rendering member:", member);

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${bgClass}`}
                  >
                    {getInitials(member)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">
                        {member?.firstName} {member?.lastName}{" "}
                        {isCurrentUser && <span className="text-sm text-gray-500">(You)</span>}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}`}
                  >
                    <RoleIcon className="w-3 h-3" />
                    <span>{member.role}</span>
                  </div>

                  {canManageMembers && member.role !== "OWNER" && !isCurrentUser && (
                    <div className="flex items-center space-x-2">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateMemberRole(
                            member.id,
                            e.target.value as "EDITOR" | "VIEWER"
                          )
                        }
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={updatingMemberId === member.id}
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                      </select>

                      <button
                        onClick={() =>
                          setRemoveConfirm({
                            id: member.id,
                            name: `${member.firstName || ""} ${member.lastName || ""}`.trim(),
                          })
                        }
                        className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                        disabled={removingMemberId === member.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Role Descriptions */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Role Permissions</h4>
          <div className="space-y-2">
            {Object.entries(roleDescriptions).map(([role, description]) => {
              const RoleIcon = roleIcons[role as keyof typeof roleIcons];
              return (
                <div key={role} className="flex items-center space-x-2 text-xs text-gray-600">
                  <div
                    className={`flex items-center space-x-1 px-2 py-1 rounded ${
                      roleColors[role as keyof typeof roleColors]
                    }`}
                  >
                    <RoleIcon className="w-3 h-3" />
                    <span className="font-medium">{role}</span>
                  </div>
                  <span>{description}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>

      {/* Add Member Modal */}
      <Modal
        isOpen={addMemberModalOpen}
        onClose={() => {
          console.log("Closing Add Member Modal");
          setAddMemberModalOpen(false);
          setNewMemberEmail("");
          setNewMemberRole("EDITOR");
        }}
        title="Add Board Member"
      >
        <form onSubmit={handleAddMember} className="space-y-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <Mail className="w-4 h-4 text-blue-600" />
            <span>The user will receive an invitation to join this board.</span>
          </div>

          <Input
            label="Email address"
            type="email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            placeholder="Enter user's email address"
            required
            autoFocus
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value as "EDITOR" | "VIEWER")}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="EDITOR">Editor - Can create and edit tasks</option>
              <option value="VIEWER">Viewer - Can only view tasks</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log("Cancelling Add Member");
                setAddMemberModalOpen(false);
                setNewMemberEmail("");
                setNewMemberRole("EDITOR");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              <UserPlus className="w-4 h-4 mr-2" /> Add Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Member Confirmation Modal */}
      <Modal
        isOpen={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        title="Remove Member"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to remove <strong>{removeConfirm?.name}</strong> from this board?
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setRemoveConfirm(null)} disabled={!!removingMemberId}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => removeConfirm && handleRemoveMemberConfirmed(removeConfirm.id)}
              loading={!!removingMemberId}
            >
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
