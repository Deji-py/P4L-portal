// "use client";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Pen } from "lucide-react";
// import React, { useState, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import useAuth from "@/hooks/useAuth";
// import useAccount from "@/hooks/useAccount";

// // Define TypeScript interfaces
// interface UserData {
//   email?: string;
//   id?: string;
//   adminData?: {
//     name?: string;
//     role?: string;
//   };
//   first_name?: string;
//   last_name?: string;
//   phone?: string | null;
//   gender?: "male" | "female" | "other" | null;
// }

// // Define the validation schema using Zod
// const profileSchema = z.object({
//   first_name: z
//     .string()
//     .min(2, { message: "First name must be at least 2 characters" })
//     .max(50, { message: "First name must be less than 50 characters" }),
//   last_name: z
//     .string()
//     .min(2, { message: "Last name must be at least 2 characters" })
//     .max(50, { message: "Last name must be less than 50 characters" }),
//   phone: z
//     .string()
//     .min(11, { message: "Phone number must be at least 11 characters" })
//     .max(11, { message: "Phone number must be at most 11 digits" }),
//   gender: z
//     .union([z.literal("male"), z.literal("female"), z.literal("other")])
//     .optional(),
// });

// // Infer the form type from the schema
// type ProfileFormData = z.infer<typeof profileSchema>;

// // Mock type definitions for hooks (replace with actual implementations)
// interface UseAuth {
//   user: UserData | null;
// }

// const UserProfile: React.FC = () => {
//   const { user } = useAuth() as UseAuth;
//   const { updateAccount, useUserQuery } = useAccount();
//   const { data } = useUserQuery(user?.id as string);

//   const [loading, setLoading] = useState(false);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);

//   // Initialize react-hook-form with Zod resolver
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     setValue,
//     reset,
//   } = useForm<ProfileFormData>({
//     resolver: zodResolver(profileSchema),
//     defaultValues: {
//       first_name: user?.adminData?.name?.split(" ")[0] || "",
//       last_name: user?.adminData?.name?.split(" ")[1] || "",
//       phone: "",
//       gender: undefined,
//     },
//   });

//   // Update form values when user data is fetched
//   useEffect(() => {
//     if (data) {
//       reset({
//         first_name:
//           data.first_name || user?.adminData?.name?.split(" ")[0] || "",
//         last_name: data.last_name || user?.adminData?.name?.split(" ")[1] || "",
//         phone: data.phone || "",
//         gender: data.gender || undefined,
//       });
//     }
//   }, [data, reset, user?.adminData?.name]);

//   const onSubmit = async (formData: ProfileFormData) => {
//     setLoading(true);
//     try {
//       await updateAccount({
//         data: {
//           first_name: formData.first_name,
//           last_name: formData.last_name,
//           phone: formData.phone || null,
//           gender: formData.gender || null,
//         },
//         id: user?.id as string,
//       });
//       setIsDialogOpen(false); // Close dialog on successful update
//     } catch (error) {
//       // console.error("Error updating account:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       <Card className="py-3 w-full">
//         <CardContent className="flex justify-between items-center">
//           <div className="flex items-center gap-4">
//             <Avatar className="border bg-accent w-16 h-16">
//               <AvatarImage src="" alt="User profile" />
//               <AvatarFallback className="border bg-accent">WU</AvatarFallback>
//             </Avatar>
//             <div>
//               <h2 className="font-semibold flex gap-2 text-sm">
//                 {data ? `${data?.first_name} ${data?.last_name}` : "User"}
//                 <Badge
//                   variant="secondary"
//                   className="text-primary bg-secondary/30"
//                 >
//                   {user?.adminData?.role || "-"}
//                 </Badge>
//               </h2>
//               <p className="text-sm opacity-80 mt-1">{user?.email || "-"}</p>
//             </div>
//           </div>
//           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//             <DialogTrigger asChild>
//               <Button variant="ghost" className="flex items-center gap-2">
//                 <Pen className="h-4 w-4" />
//                 Edit
//               </Button>
//             </DialogTrigger>
//             <DialogContent>
//               <DialogHeader>
//                 <h2 className="text-lg font-semibold">Edit Profile</h2>
//               </DialogHeader>
//               <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-2">
//                     <Label htmlFor="first_name">First Name</Label>
//                     <Input
//                       id="first_name"
//                       {...register("first_name")}
//                       placeholder="First Name"
//                     />
//                     {errors.first_name && (
//                       <p className="text-red-500 text-sm">
//                         {errors.first_name.message}
//                       </p>
//                     )}
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="last_name">Last Name</Label>
//                     <Input
//                       id="last_name"
//                       {...register("last_name")}
//                       placeholder="Last Name"
//                     />
//                     {errors.last_name && (
//                       <p className="text-red-500 text-sm">
//                         {errors.last_name.message}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="phone">Phone Number</Label>
//                   <Input
//                     id="phone"
//                     {...register("phone")}
//                     placeholder="XXX-XXX-XXXX"
//                   />
//                   {errors.phone && (
//                     <p className="text-red-500 text-sm">
//                       {errors.phone.message}
//                     </p>
//                   )}
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="gender">Gender</Label>
//                   <Select
//                     onValueChange={(value: "male" | "female" | "other") =>
//                       setValue("gender", value)
//                     }
//                     value={data?.gender || undefined}
//                   >
//                     <SelectTrigger id="gender" className="w-full">
//                       <SelectValue placeholder="Select gender" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="male">Male</SelectItem>
//                       <SelectItem value="female">Female</SelectItem>
//                       <SelectItem value="other">Other</SelectItem>
//                     </SelectContent>
//                   </Select>
//                   {errors.gender && (
//                     <p className="text-red-500 text-sm">
//                       {errors.gender.message}
//                     </p>
//                   )}
//                 </div>
//                 <Button disabled={loading} type="submit" className="w-full">
//                   {loading ? "Updating..." : "Update Profile"}
//                 </Button>
//               </form>
//             </DialogContent>
//           </Dialog>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default UserProfile;

import React from "react";

function UserProfile() {
  return <div>UserProfile</div>;
}

export default UserProfile;
