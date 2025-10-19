"use client";


import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import logo_full from "@/../public/branding/logo_full.svg";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Role type definition
type RoleType = "aggregator" | "farmer" | "bulk_trader" | null;

// Role card data
const roles = [
  {
    id: "aggregator",
    title: "Aggregator",
    description:
      "Streamline your supply chain with intelligent data aggregation",
    icon: (
      <svg
        width="32"
        height="33"
        viewBox="0 0 32 33"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.23762 13.3491C6.42085 13.3491 6.59207 13.2635 6.933 13.0938L9.67398 11.73C10.8875 11.1248 11.4943 10.8229 11.4943 10.3453V4.33767M6.23762 13.3491C6.05439 13.3491 5.88317 13.2635 5.54224 13.0938L2.80126 11.73C1.58773 11.1248 0.980957 10.8229 0.980957 10.3453V4.33767M6.23762 13.3491V7.34148M11.4943 4.33767C11.4943 3.86007 10.8875 3.55668 9.67398 2.95292L6.933 1.58919C6.59207 1.41947 6.42236 1.33386 6.23762 1.33386C6.05439 1.33386 5.88317 1.41947 5.54224 1.58919L2.80126 2.95292C1.58773 3.55818 0.980957 3.86007 0.980957 4.33767M11.4943 4.33767C11.4943 4.81528 10.8875 5.11866 9.67398 5.72243L6.933 7.08616C6.59207 7.25587 6.42236 7.34148 6.23762 7.34148M0.980957 4.33767C0.980957 4.81528 1.58773 5.11866 2.80126 5.72243L5.54224 7.08616C5.88317 7.25587 6.05289 7.34148 6.23762 7.34148M25.7624 13.3491C25.9456 13.3491 26.1168 13.2635 26.4578 13.0938L29.1987 11.73C30.4123 11.1248 31.019 10.8229 31.019 10.3453V4.33767M25.7624 13.3491C25.5791 13.3491 25.4079 13.2635 25.067 13.0938L22.326 11.73C21.1125 11.1248 20.5057 10.8229 20.5057 10.3453V4.33767M25.7624 13.3491V7.34148M31.019 4.33767C31.019 3.86007 30.4123 3.55668 29.1987 2.95292L26.4578 1.58919C26.1168 1.41947 25.9471 1.33386 25.7624 1.33386C25.5791 1.33386 25.4079 1.41947 25.067 1.58919L22.326 2.95292C21.1125 3.55818 20.5057 3.86007 20.5057 4.33767M31.019 4.33767C31.019 4.81528 30.4123 5.11866 29.1987 5.72243L26.4578 7.08616C26.1168 7.25587 25.9471 7.34148 25.7624 7.34148M20.5057 4.33767C20.5057 4.81528 21.1125 5.11866 22.326 5.72243L25.067 7.08616C25.4079 7.25587 25.5776 7.34148 25.7624 7.34148"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M15.249 7.34149H16.751M0.980957 16.3529V21.6096C0.980957 23.7183 0.980957 24.7741 1.4871 25.5311C1.70631 25.8592 1.98803 26.1409 2.31615 26.3601C3.07311 26.8662 4.12895 26.8662 6.23762 26.8662M31.019 16.3529V21.6096C31.019 23.7183 31.019 24.7741 30.5129 25.5311C30.2937 25.8592 30.012 26.1409 29.6838 26.3601C28.9269 26.8662 27.8711 26.8662 25.7624 26.8662"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M16 31.3719C16.1832 31.3719 16.3544 31.2878 16.6953 31.1166L19.4363 29.7529C20.6498 29.1491 21.2566 28.8457 21.2566 28.3681V22.3605M16 31.3719C15.8167 31.3719 15.6455 31.2878 15.3046 31.1166L12.5636 29.7529C11.3501 29.1491 10.7433 28.8457 10.7433 28.3681V22.3605M16 31.3719V25.3643M21.2566 22.3605C21.2566 21.8829 20.6498 21.5795 19.4363 20.9757L16.6953 19.612C16.3544 19.4408 16.1847 19.3567 16 19.3567C15.8167 19.3567 15.6455 19.4408 15.3046 19.612L12.5636 20.9757C11.3501 21.5795 10.7433 21.8829 10.7433 22.3605M21.2566 22.3605C21.2566 22.8381 20.6498 23.1415 19.4363 23.7453L16.6953 25.109C16.3544 25.2802 16.1847 25.3643 16 25.3643M10.7433 22.3605C10.7433 22.8381 11.3501 23.1415 12.5636 23.7453L15.3046 25.109C15.6455 25.2802 15.8152 25.3643 16 25.3643"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "farmer",
    title: "Farmer",
    description:
      "Connect directly with markets and maximize your harvest value",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2C12 2 9 5 9 9C9 10.6569 10.3431 12 12 12C13.6569 12 15 10.6569 15 9C15 5 12 2 12 2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 12V22M12 22C9.23858 22 7 19.7614 7 17V15M12 22C14.7614 22 17 19.7614 17 17V15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 15C7 15 5.5 14 4 14C2.5 14 2 15 2 15M17 15C17 15 18.5 14 20 14C21.5 14 22 15 22 15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "bulk_trader",
    title: "Bulk Trader",
    description:
      "Access premium wholesale markets and execute high-volume trades",
    icon: (
      <svg
        width="32"
        height="26"
        viewBox="0 0 38 31"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M27.5403 29.0181C28.4463 29.0181 29.3152 28.6582 29.9559 28.0175C30.5965 27.3769 30.9564 26.5079 30.9564 25.6019C30.9564 24.6959 30.5965 23.827 29.9559 23.1864C29.3152 22.5457 28.4463 22.1858 27.5403 22.1858C26.6343 22.1858 25.7654 22.5457 25.1247 23.1864C24.4841 23.827 24.1241 24.6959 24.1241 25.6019C24.1241 26.5079 24.4841 27.3769 25.1247 28.0175C25.7654 28.6582 26.6343 29.0181 27.5403 29.0181ZM10.4596 29.0181C11.3656 29.0181 12.2345 28.6582 12.8752 28.0175C13.5158 27.3769 13.8757 26.5079 13.8757 25.6019C13.8757 24.6959 13.5158 23.827 12.8752 23.1864C12.2345 22.5457 11.3656 22.1858 10.4596 22.1858C9.55358 22.1858 8.68467 22.5457 8.04402 23.1864C7.40337 23.827 7.04346 24.6959 7.04346 25.6019C7.04346 26.5079 7.40337 27.3769 8.04402 28.0175C8.68467 28.6582 9.55358 29.0181 10.4596 29.0181Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M30.9565 13.6454H36.0807M36.0807 13.6454V17.0616C36.0807 21.0875 36.0807 23.0996 34.8304 24.3516C33.9986 25.1835 32.8302 25.4619 30.9565 25.5541M36.0807 13.6454L33.9012 9.59732C32.7226 7.40758 32.1333 6.31271 31.1205 5.70976C30.1093 5.1051 28.8675 5.1051 26.3806 5.1051H23.2702M7.04352 25.5541C5.16977 25.4619 4.00316 25.1835 3.16962 24.3516C1.91931 23.0996 1.91931 21.0875 1.91931 17.0616V10.2293C1.91931 6.20339 1.91931 4.18958 3.16962 2.93927C4.41992 1.68896 6.43374 1.68896 10.4597 1.68896H16.0963C18.0042 1.68896 18.9573 1.68896 19.7293 1.94005C20.4984 2.18995 21.1973 2.61828 21.7691 3.19005C22.3409 3.76182 22.7692 4.46078 23.0191 5.22979C23.2702 6.00184 23.2702 6.95494 23.2702 8.86285C23.2702 10.9467 23.2702 11.9903 22.6997 12.6958C22.5869 12.8347 22.4605 12.9611 22.3205 13.075C21.6151 13.6454 20.5731 13.6454 18.4876 13.6454H12.1677M24.1242 25.6019H13.8758"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.5839 17.0615C15.5839 17.0615 14.436 16.1118 13.4266 15.21C12.7143 14.6361 12.1677 14.1459 12.1677 13.6539C12.1677 13.2184 12.5947 12.8136 13.2882 12.1782C14.2721 11.36 15.5839 10.2292 15.5839 10.2292"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const RoleSelectionScreen = () => {
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const router = useRouter();

  const handleContinue = () => {
    if (selectedRole) {
      // Navigate to: `/login/${selectedRole}`
      router.push(`/login/${selectedRole}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex-col flex items-center gap-6 justify-center p-4 pb-10">
      <a
        href="#"
        className="flex items-center border-b w-full 2xl:absolute top-0 left-0 justify-center pl-3  self-center font-medium"
      >
        <Image src={logo_full} alt="logo" className=" w-24 lg:w-28 my-4 " />
      </a>
      <div className="w-full max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font font-bold tracking-tight  mt-3">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
           Please select your role to continue
          </p>
        </motion.div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-8">
          {roles.map((role, index) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => setSelectedRole(role.id as RoleType)}
              className={`relative p-6 rounded-xl border transition-all duration-300 text-left group  ${
                selectedRole === role.id
                  ? "border-primary bg-primary/3 "
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              {/* Selection Indicator */}
              <div
                className={`absolute top-4 right-4 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  selectedRole === role.id
                    ? "border-primary bg-secondary"
                    : "border-muted-foreground/30"
                }`}
              >
                {selectedRole === role.id && (
                  <Check className="w-4 h-4 text-black" />
                )}
              </div>

              {/* Icon */}
              <div
                className={`mb-4 transition-colors duration-300 ${
                  selectedRole === role.id
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-primary"
                }`}
              >
                {role.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-2">{role.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {role.description}
              </p>
            </motion.button>
          ))}
        </div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center  pt-10"
        >
          <Button
            variant={"secondary"}
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`
              px-8 py-3 rounded-lg  font-medium transition-all duration-300
              flex items-center gap-2 group
              ${
                selectedRole
                  ? "bg-primary ring-4 ring-primary/20 text-primary-foreground hover:bg-primary  cursor-pointer"
                  : "bg-muted ring-4 border ring-muted/20 text-muted-foreground cursor-not-allowed"
              }
            `}
          >
            Continue
            <ArrowRight
              className={`w-5 h-5 transition-transform duration-300 ${
                selectedRole ? "group-hover:translate-x-1" : ""
              }`}
            />
          </Button>
        </motion.div>

        {/* Footer Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RoleSelectionScreen;
