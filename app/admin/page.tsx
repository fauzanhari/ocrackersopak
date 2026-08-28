import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const dynamic = "force-dynamic";
  
export default async function AdminPage() {
  const user = await getCurrentUser();

  // Redirect to login if user is not authenticated or not an admin
  if (!user || !user.isAdmin) {
    redirect("/login");
  }

  // Pre-load statistics data
  const totalUsers = await prisma.user.count();
  
  const sumResult = await prisma.user.aggregate({
    _sum: {
      tokenBalance: true,
    },
  });
  const totalTokenBalance = sumResult._sum.tokenBalance ?? 0;

  const totalRedeemCodes = await prisma.redeemCode.count();
  const totalRedeemedCodes = await prisma.redeemCode.count({
    where: { isRedeemed: true },
  });

  // Pre-load recent codes list
  const initialCodes = await prisma.redeemCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Serialize Prisma Date object fields to ISO strings for Next.js Client Component compatibility
  const serializedCodes = initialCodes.map(code => ({
    ...code,
    createdAt: code.createdAt.toISOString(),
    updatedAt: code.updatedAt.toISOString(),
    redeemedAt: code.redeemedAt ? code.redeemedAt.toISOString() : null,
  }));

  // Pre-load site settings
  const initialSettingsList = await prisma.siteSetting.findMany();
  const initialSettings = initialSettingsList.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  return (
    <AdminDashboardClient
      user={user}
      initialStats={{
        totalUsers,
        totalTokenBalance,
        totalRedeemCodes,
        totalRedeemedCodes,
      }}
      initialCodes={serializedCodes}
      initialSettings={initialSettings}
    />
  );
}
