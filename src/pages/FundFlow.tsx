import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SAMPLE_PROJECTS, DISTRICTS } from "@/lib/sampleData";
import { DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from "recharts";

const FundFlow = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  if (!profile) return null;

  const isStateOfficial = profile.role === "state_official";

  // Calculate fund flow data
  const fundFlowData = isStateOfficial
    ? DISTRICTS.map((district) => {
        const districtProjects = SAMPLE_PROJECTS.filter((p) => p.district === district);
        const allocated = districtProjects.reduce((sum, p) => sum + p.budget_allocated, 0);
        const utilized = districtProjects.reduce((sum, p) => sum + p.fund_utilized, 0);
        return {
          name: district,
          allocated: allocated / 100000,
          utilized: utilized / 100000,
        };
      })
    : SAMPLE_PROJECTS
        .filter((p) => p.district === profile.assigned_district)
        .map((p) => ({
          name: p.name.substring(0, 20) + "...",
          allocated: p.budget_allocated / 100000,
          utilized: p.fund_utilized / 100000,
        }));

  const totalAllocated = SAMPLE_PROJECTS
    .filter((p) => !profile.assigned_district || p.district === profile.assigned_district)
    .reduce((sum, p) => sum + p.budget_allocated, 0);

  const totalUtilized = SAMPLE_PROJECTS
    .filter((p) => !profile.assigned_district || p.district === profile.assigned_district)
    .reduce((sum, p) => sum + p.fund_utilized, 0);

  const utilizationRate = ((totalUtilized / totalAllocated) * 100).toFixed(1);

  return (
    <DashboardLayout 
      userRole={profile.role} 
      userDistrict={profile.assigned_district}
      userEmail={profile.email}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-success" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fund Flow</h1>
            <p className="text-muted-foreground mt-1">Track budget allocation and utilization</p>
          </div>
        </div>

        {/* Fund Flow Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Allocated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(totalAllocated / 10000000).toFixed(2)} Cr</div>
              <p className="text-xs text-muted-foreground mt-1">
                {isStateOfficial ? "State-wide allocation" : `${profile.assigned_district} district`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Utilized</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">₹{(totalUtilized / 10000000).toFixed(2)} Cr</div>
              <p className="text-xs text-muted-foreground mt-1">
                Funds spent on projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Utilization Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{utilizationRate}%</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-success" />
                <p className="text-xs text-success">On track</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fund Flow Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isStateOfficial ? "District-wise Fund Allocation" : "Project-wise Fund Allocation"}
            </CardTitle>
            <CardDescription>
              Comparison of allocated vs utilized funds (in Lakhs)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={fundFlowData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis label={{ value: 'Amount (₹ Lakhs)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value: number) => `₹${value.toFixed(2)}L`}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="allocated" fill="hsl(var(--primary))" name="Allocated" />
                <Bar dataKey="utilized" fill="hsl(var(--success))" name="Utilized" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fund Flow Diagram */}
        <Card>
          <CardHeader>
            <CardTitle>Fund Flow Structure</CardTitle>
            <CardDescription>
              {isStateOfficial 
                ? "Centre → State → District → Agency" 
                : "State → District → Agency → Contractor"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-around py-8">
              {isStateOfficial ? (
                <>
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                      <DollarSign className="h-10 w-10 text-primary" />
                    </div>
                    <p className="font-medium">Centre</p>
                    <p className="text-sm text-muted-foreground">₹{(totalAllocated / 10000000).toFixed(2)} Cr</p>
                  </div>
                  <ArrowRight className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                      <DollarSign className="h-10 w-10 text-accent" />
                    </div>
                    <p className="font-medium">State</p>
                    <p className="text-sm text-muted-foreground">₹{(totalAllocated / 10000000).toFixed(2)} Cr</p>
                  </div>
                  <ArrowRight className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-2">
                      <DollarSign className="h-10 w-10 text-success" />
                    </div>
                    <p className="font-medium">Districts</p>
                    <p className="text-sm text-muted-foreground">₹{(totalUtilized / 10000000).toFixed(2)} Cr</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                      <DollarSign className="h-8 w-8 text-primary" />
                    </div>
                    <p className="font-medium text-sm">State</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                      <DollarSign className="h-8 w-8 text-accent" />
                    </div>
                    <p className="font-medium text-sm">District</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-2">
                      <DollarSign className="h-8 w-8 text-success" />
                    </div>
                    <p className="font-medium text-sm">Agency</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-warning/20 flex items-center justify-center mb-2">
                      <DollarSign className="h-8 w-8 text-warning" />
                    </div>
                    <p className="font-medium text-sm">Contractor</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FundFlow;
