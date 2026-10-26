import { CreditCard, LayoutDashboard, Package, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlansTab } from "./PlansTab"
import { PaymentsTab } from "./PaymentsTab"
import { UsersTab } from "./UsersTab"

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-primary to-primary/85 text-primary-foreground shadow-apple-sm">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight sm:text-[34px]">
            Panel de Administración
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Gestiona planes, pagos y usuarios de Travelia
          </p>
        </div>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">
            <Package className="h-4 w-4" />
            Planes
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <PlansTab />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTab />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
