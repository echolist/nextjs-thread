
"use client"
import { usePathname, useRouter } from "next/navigation";
import { sidebarLinks } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import { SignOutButton, SignedIn } from "@clerk/nextjs";

function Bottombar() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <section className="bottombar">
      <div className="bottombar_container">
        {sidebarLinks.map((link) => {
          const isActive =
            (pathname.includes(link.route) && link.route.length > 1) ||
            pathname === link.route;
          return (
            <Link
              href={link.route}
              key={link.label}
              className={`bottombar_link 
                        ${isActive && "bg-primary-500"}`}
            >
              <Image
                src={link.imgURL}
                alt={link.label}
                width={24}
                height={24}
              />
              <p className="text-light-1 max-sm:hidden text-subtle-medium">
                    {link.label.split(/\s+/)[0]}
                </p>
            </Link>
          );
        })}
        <div className="">
          <SignedIn>
            <SignOutButton
              signOutCallback={() => {
                router.push("/sign-in");
              }}
            >
              <div className="flex gap-2 cursor-pointer bottombar_link">
                <Image
                  src="/assets/logout.svg"
                  alt="logout"
                  width={24}
                  height={24}
                />
                <p className="text-light-1 max-sm:hidden text-subtle-medium">Logout</p>
              </div>
            </SignOutButton>
          </SignedIn>
        </div>
      </div>
    </section>
  );
}
export default Bottombar;
