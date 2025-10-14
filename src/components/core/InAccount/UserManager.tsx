// "use client";
// import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Plus, Trash2 } from "lucide-react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// // Assuming these hooks and client exist and are correctly implemented
// import useAuth from "@/hooks/useAuth";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { supabaseClient } from "@/utils/client";
// import { useQuery, useQueryClient } from "@tanstack/react-query";

// // Define TypeScript interfaces
// interface User {
//   id: string;
//   email: string;
//   first_name?: string | null;
//   last_name?: string | null;
//   role?: string | null; // Ensure role is part of the User interface
// }

// interface UserData {
//   id?: string;
//   email?: string;
//   adminData?: {
//     name?: string;
//     role?: string;
//   };
// }

// // Define the validation schema for invitation form
// const inviteSchema = z.object({
//   email: z
//     .string()
//     .email({ message: "Please enter a valid email address" })
//     .min(1, { message: "Email is required" }),
// });

// // Infer the form type from the schema
// type InviteFormData = z.infer<typeof inviteSchema>;

// // Mock type definitions for hooks (replace with actual types if available)
// interface UseAuth {
//   user: UserData | null;
//   userLoading: boolean;
// }

// interface UseAccount {
//   useUsersQuery: (userId: string) => {
//     data: User[] | undefined;
//     isLoading: boolean;
//   };
//   sendInvitation: (data: {
//     email: string;
//     invited_by: string;
//   }) => Promise<void>;
//   updateUserRole: (data: { id: string; role: string }) => Promise<void>;
// }

// const UserManager: React.FC = () => {
//   const { user, userLoading } = useAuth() as UseAuth;
//   const { useUsersQuery, sendInvitation, updateUserRole } = useAccount();
//   const queryClient = useQueryClient();

//   const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
//   const [userToDelete, setUserToDelete] = useState<string | null>(null);
//   const [roleFilter, setRoleFilter] = useState<string>("all");
//   const [isDeleting, setIsDeleting] = useState(false);

//   // New states for "Add to Admin" functionality
//   const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false);
//   const [selectedUserToAddAdmin, setSelectedUserToAddAdmin] = useState<
//     string | null
//   >(null);
//   const [selectedRoleForAdmin, setSelectedRoleForAdmin] =
//     useState<string>("admin"); // Default role

//   const { data: users = [], isLoading: usersLoading } = useUsersQuery(
//     user?.id as string
//   );

//   // NEW: Local useQuery hook to fetch all users
//   const { data: allUsers = [], isLoading: AllusersLoading } = useQuery<
//     User[],
//     Error
//   >({
//     queryKey: ["all-users"], // Unique query key for all users
//     queryFn: async () => {
//       const { data, error } = await supabaseClient
//         .from("users")
//         .select("id, email, first_name, last_name"); // Ensure 'role' is selected

//       if (error) {
//         throw error;
//       }
//       return data || [];
//     },
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     gcTime: 10 * 60 * 1000, // 10 minutes
//   });

//   // Filter users based on role for the main table
//   const filteredUsers =
//     roleFilter === "all"
//       ? users
//       : users?.filter((user: User) => user.role === roleFilter);

//   // Initialize react-hook-form with Zod resolver
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//     reset,
//   } = useForm<InviteFormData>({
//     resolver: zodResolver(inviteSchema),
//     defaultValues: {
//       email: "",
//     },
//   });

//   // Delete user function (moved inside component for direct supabaseClient access)
//   const deleteUser = async (userId: string) => {
//     try {
//       const { error } = await supabaseClient
//         .from("users")
//         .delete()
//         .eq("id", userId);
//       if (error) throw new Error(error.message);
//       return true;
//     } catch (error) {
//       throw new Error(`Failed to delete user`);
//     }
//   };

//   const handleInvite = async (data: InviteFormData) => {
//     try {
//       await sendInvitation({
//         email: data.email,
//         invited_by: user?.id as string,
//       });
//       reset();
//       setIsInviteDialogOpen(false);
//     } catch (error) {
//       // console.error("Error sending invitation:", error);
//     }
//   };

//   const handleRoleChange = async (userId: string, role: string) => {
//     try {
//       await updateUserRole({ id: userId, role });
//     } catch (error) {
//       // console.error("Error updating role:", error);
//     }
//   };

//   const handleDeleteUser = async () => {
//     if (!userToDelete) return;
//     setIsDeleting(true);
//     try {
//       await deleteUser(userToDelete);
//       setIsDeleteDialogOpen(false);
//       setUserToDelete(null);
//       // Assuming useUsersQuery will re-fetch due to react-query invalidation
//     } catch (error) {
//       // console.error("Error deleting user:", error);
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   // New handler for adding user to admin role
//   const handleAddToAdmin = async () => {
//     if (!selectedUserToAddAdmin || !selectedRoleForAdmin) return;
//     try {
//       await updateUserRole({
//         id: selectedUserToAddAdmin,
//         role: selectedRoleForAdmin,
//       });
//       setIsAddAdminDialogOpen(false);
//       setSelectedUserToAddAdmin(null); // Reset selected user
//       setSelectedRoleForAdmin("admin"); // Reset selected role
//       queryClient.invalidateQueries({ queryKey: ["users"] });
//     } catch (error) {
//       // console.error("Error adding user to admin:", error);
//     }
//   };

//   if (user?.adminData?.role?.toLowerCase() === "admin") {
//     return null;
//   }

//   return (
//     <Card className="pt-0">
//       <CardHeader></CardHeader>
//       <CardContent>
//         <div className="flex justify-between mb-4">
//           <Select onValueChange={setRoleFilter} value={roleFilter}>
//             <SelectTrigger className="w-[180px]">
//               <SelectValue placeholder="All" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All</SelectItem>
//               <SelectItem value="admin">Admin</SelectItem>
//               <SelectItem value="superadmin">Super Admin</SelectItem>
//             </SelectContent>
//           </Select>

//           <div className="flex gap-2">
//             {" "}
//             {/* Group buttons */}
//             {/* Invite User Dialog */}
//             <Dialog
//               open={isInviteDialogOpen}
//               onOpenChange={setIsInviteDialogOpen}
//             >
//               {/* <DialogTrigger asChild>
//                 <Button disabled={userLoading}>
//                   Invite User
//                   <Plus className="ml-2 h-4 w-4" />
//                 </Button>
//               </DialogTrigger> */}
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Invite New User</DialogTitle>
//                 </DialogHeader>
//                 <form
//                   onSubmit={handleSubmit(handleInvite)}
//                   className="space-y-4"
//                 >
//                   <div>
//                     <Label htmlFor="email">Email Address</Label>
//                     <Input
//                       id="email"
//                       type="email"
//                       placeholder="Enter email address"
//                       {...register("email")}
//                       className="mt-2"
//                     />
//                     {errors.email && (
//                       <p className="text-red-500 text-sm mt-1">
//                         {errors.email.message}
//                       </p>
//                     )}
//                   </div>
//                   <Button
//                     type="submit"
//                     className="w-full"
//                     disabled={isSubmitting}
//                   >
//                     {isSubmitting ? "Sending..." : "Send Invitation"}
//                   </Button>
//                 </form>
//               </DialogContent>
//             </Dialog>
//             {/* New: Add to Admin Dialog */}
//             <Dialog
//               open={isAddAdminDialogOpen}
//               onOpenChange={setIsAddAdminDialogOpen}
//             >
//               <DialogTrigger asChild>
//                 <Button disabled={AllusersLoading || allUsers.length === 0}>
//                   Add to Admin
//                   <Plus className="ml-2 h-4 w-4" />
//                 </Button>
//               </DialogTrigger>
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Add User to Admin Role</DialogTitle>
//                 </DialogHeader>
//                 <div className="space-y-4">
//                   <div>
//                     <Label htmlFor="user-select">Select User</Label>
//                     <Select
//                       onValueChange={setSelectedUserToAddAdmin}
//                       value={selectedUserToAddAdmin || ""}
//                       disabled={allUsers.length === 0}
//                     >
//                       <SelectTrigger id="user-select" className="mt-2 w-full">
//                         <SelectValue placeholder="Select a user" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {allUsers.length === 0 ? (
//                           <SelectItem value="no-users" disabled>
//                             No non-admin users available
//                           </SelectItem>
//                         ) : (
//                           allUsers.map((u) => (
//                             <SelectItem key={u.id} value={u.id}>
//                               {`${u.first_name || ""} ${
//                                 u.last_name || ""
//                               }`.trim() || u.email}
//                             </SelectItem>
//                           ))
//                         )}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div>
//                     <Label htmlFor="role-select">Select Role</Label>
//                     <Select
//                       onValueChange={setSelectedRoleForAdmin}
//                       value={selectedRoleForAdmin}
//                     >
//                       <SelectTrigger id="role-select" className="mt-2 w-full">
//                         <SelectValue placeholder="Select role" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="admin">Admin</SelectItem>
//                         <SelectItem value="superadmin">Super Admin</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>
//                 <DialogFooter>
//                   <Button
//                     variant="outline"
//                     onClick={() => {
//                       setIsAddAdminDialogOpen(false);
//                       setSelectedUserToAddAdmin(null);
//                       setSelectedRoleForAdmin("admin"); // Reset to default
//                     }}
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     onClick={handleAddToAdmin}
//                     disabled={!selectedUserToAddAdmin || !selectedRoleForAdmin}
//                   >
//                     Add to Admin
//                   </Button>
//                 </DialogFooter>
//               </DialogContent>
//             </Dialog>
//           </div>
//         </div>

//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Member</TableHead>
//               <TableHead>Role</TableHead>
//               <TableHead>Email</TableHead>
//               <TableHead></TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {usersLoading ? (
//               <TableRow>
//                 <TableCell colSpan={4}>Loading...</TableCell>
//               </TableRow>
//             ) : filteredUsers.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={4}>No users found</TableCell>
//               </TableRow>
//             ) : (
//               filteredUsers.map((user) => (
//                 <TableRow key={user.id}>
//                   <TableCell>
//                     <div className="flex items-center gap-2">
//                       <Avatar className="w-8 bg-accent h-8">
//                         <AvatarImage
//                           src="/placeholder.svg" // Placeholder for user avatar image
//                           alt={`${user.first_name} ${user.last_name}`}
//                         />
//                         <AvatarFallback className="bg-accent">
//                           {(user.first_name?.[0] || "") +
//                             (user.last_name?.[0] || "")}
//                         </AvatarFallback>
//                       </Avatar>
//                       {`${user.first_name || ""} ${
//                         user.last_name || ""
//                       }`.trim() || user.email}
//                     </div>
//                   </TableCell>
//                   <TableCell>
//                     <Select
//                       onValueChange={(value) =>
//                         handleRoleChange(user.id, value)
//                       }
//                       value={user.role || "user"} // Default to 'user' if role is null
//                     >
//                       <SelectTrigger className="w-[130px]">
//                         <SelectValue placeholder="Select role" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="admin">Admin</SelectItem>
//                         <SelectItem value="superadmin">Super Admin</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </TableCell>
//                   <TableCell>{user.email}</TableCell>
//                   <TableCell>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       className="text-red-500"
//                       onClick={() => {
//                         setUserToDelete(user.id);
//                         setIsDeleteDialogOpen(true);
//                       }}
//                       disabled={user.id === userToDelete && isDeleting}
//                     >
//                       <Trash2 className="h-4 w-4" />
//                     </Button>
//                   </TableCell>
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>

//         <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Confirm Delete</DialogTitle>
//             </DialogHeader>
//             <p>
//               Are you sure you want to delete this user? This action cannot be
//               undone.
//             </p>
//             <DialogFooter>
//               <Button
//                 variant="outline"
//                 onClick={() => {
//                   setIsDeleteDialogOpen(false);
//                   setUserToDelete(null);
//                 }}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 variant="destructive"
//                 onClick={handleDeleteUser}
//                 disabled={isDeleting}
//               >
//                 {isDeleting ? "Deleting..." : "Delete"}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </CardContent>
//     </Card>
//   );
// };

// export default UserManager;

import React from "react";

function UserManager() {
  return <div>UserManager</div>;
}

export default UserManager;
