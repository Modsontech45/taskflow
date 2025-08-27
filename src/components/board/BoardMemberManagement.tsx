import React, { useState } from "react";
import { apiClient } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
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

export function BoardMemberManagement({
  board,
  onMembersUpdate,
}: BoardMemberManagementProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"EDITOR" | "VIEWER">(
    "EDITOR"
  );
  const [loading, setLoading] = useState(false);

  const isOwner = board.ownerId === user?.id;
  const canManageMembers = isOwner;

  const roleIcons = {
    OWNER: Crown,
    EDITOR: Edit3,
    VIEWER: Eye,
  };

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

  // ------------------- Add Member -------------------
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) {
      showToast(
        "error",
        "Email required",
        "Please enter a valid email address."
      );
      return;
    }

    setLoading(true);
    try {
      const memberData = await apiClient.addMember({
        boardId: board.id,
        userId: newMemberEmail, // backend resolves email to userId
        role: newMemberRole,
      });

      const updatedMembers = [
        ...(board.members || []),
        {
          id: memberData.id,
          userId: memberData.userId,
          role: memberData.role,
          user: {
            id: memberData.userId,
            firstName: memberData.user.firstName,
            lastName: memberData.user.lastName,
            email: memberData.user.email,
          },
        },
      ];

      onMembersUpdate(updatedMembers);
      setAddMemberModalOpen(false);
      setNewMemberEmail("");
      setNewMemberRole("EDITOR");
      showToast(
        "success",
        "Member added",
        "The user has been added to the board."
      );
    } catch (error: any) {
      console.error("Error adding member:", error);
      showToast(
        "error",
        "Failed to add member",
        error.message || "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------- Update Member Role -------------------
  const handleUpdateMemberRole = async (userId: string, newRole: string) => {
    try {
      await apiClient.updateMember({
        boardId: board.id,
        userId,
        role: newRole,
      });

      const updatedMembers = (board.members || []).map((member) =>
        member.userId === userId ? { ...member, role: newRole as any } : member
      );

      onMembersUpdate(updatedMembers);
      showToast(
        "success",
        "Role updated",
        "Member role has been updated successfully."
      );
    } catch (error: any) {
      console.error("Error updating member role:", error);
      showToast(
        "error",
        "Failed to update role",
        error.message || "Please try again."
      );
    }
  };

  // ------------------- Remove Member -------------------
  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${memberName} from this board?`
      )
    )
      return;

    try {
      await apiClient.removeMember({ boardId: board.id, userId });

      const updatedMembers = (board.members || []).filter(
        (member) => member.userId !== userId
      );
      onMembersUpdate(updatedMembers);
      showToast(
        "success",
        "Member removed",
        "The member has been removed from the board."
      );
    } catch (error: any) {
      console.error("Error removing member:", error);
      showToast(
        "error",
        "Failed to remove member",
        error.message || "Please try again."
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Board Members
            </h3>
            <span className="text-sm text-gray-500">
              ({board.members?.length || 0})
            </span>
          </div>
          {canManageMembers && (
            <Button onClick={() => setAddMemberModalOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" /> Add Member
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {board.members?.map((member) => {
            const RoleIcon = roleIcons[member.role];
            const isCurrentUser = member.userId === user?.id;

            return (
              <div
                key={member.userId}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {member.user?.firstName?.[0] || "U"}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">
                        {member.user?.firstName} {member.user?.lastName}
                        {isCurrentUser && (
                          <span className="text-sm text-gray-500">(You)</span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {member.user?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                      roleColors[member.role]
                    }`}
                  >
                    <RoleIcon className="w-3 h-3" />
                    <span>{member.role}</span>
                  </div>

                  {canManageMembers &&
                    member.role !== "OWNER" &&
                    !isCurrentUser && (
                      <div className="flex items-center space-x-1">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleUpdateMemberRole(
                              member.userId,
                              e.target.value
                            )
                          }
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="EDITOR">Editor</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                        <button
                          onClick={() =>
                            handleRemoveMember(
                              member.userId,
                              `${member.user?.firstName} ${member.user?.lastName}`
                            )
                          }
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Remove member"
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

        {/* Role descriptions */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Role Permissions
          </h4>
          <div className="space-y-2">
            {Object.entries(roleDescriptions).map(([role, description]) => {
              const RoleIcon = roleIcons[role as keyof typeof roleIcons];
              return (
                <div
                  key={role}
                  className="flex items-center space-x-2 text-xs text-gray-600"
                >
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
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              value={newMemberRole}
              onChange={(e) =>
                setNewMemberRole(e.target.value as "EDITOR" | "VIEWER")
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                setAddMemberModalOpen(false);
                setNewMemberEmail("");
                setNewMemberRole("EDITOR");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              <UserPlus className="w-4 h-4 mr-2" /> Add Member
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
