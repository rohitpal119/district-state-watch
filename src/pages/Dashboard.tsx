import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import DashboardLayout from "@/components/layout/DashboardLayout";
import KPICard from "@/components/dashboard/KPICard";
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  DollarSign,
  TrendingUp,
  Activity
} from "lucide-react";
import { SAMPLE_PROJECTS, SAMPLE_ALERTS, SAMPLE_FEEDBACK, calculateKPIs, DISTRICTS } from "@/lib/sampleData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface Profile {
  role: "state_official" | "district_collector" | "contractor";
  assigned_district: string | null;
  email: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else if (user === null && !loading) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      if (data.role === "contractor") {
        navigate("/contractor-dashboard");
        return;
      }
      
      setProfile({
        role: data.role,
        assigned_district: data.assigned_district,
        email: data.email,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isStateOfficial = profile.role === "state_official";
  const kpis = calculateKPIs(SAMPLE_PROJECTS, isStateOfficial ? undefined : profile.assigned_district || undefined);

  const districtData = DISTRICTS.map((district) => {
    const districtProjects = SAMPLE_PROJECTS.filter((p) => p.district === district);
    const completed = districtProjects.filter((p) => p.status === "completed").length;
    const delayed = districtProjects.filter((p) => p.status === "delayed").length;
    const total = districtProjects.length;
    
    return {
      district,
      completed: total > 0 ? Math.round((completed / total) * 100) : 0,
      delayed,
      total,
    };
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "ongoing": return "secondary";
      case "delayed": return "destructive";
      default: return "outline";
    }
  };

  return (
    <DashboardLayout 
      userRole={profile.role} 
      userDistrict={profile.assigned_district}
      userEmail={profile.email}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isStateOfficial ? "State Overview" : `${profile.assigned_district} Dashboard`}
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and track PM-AJAY project performance
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <KPICard
            title="Total Projects"
            value={kpis.totalProjects}
            icon={Building2}
            variant="default"
          />
          <KPICard
            title="Completed"
            value={`${kpis.completedPercent}%`}
            icon={CheckCircle2}
            variant="success"
          />
          <KPICard
            title="Ongoing"
            value={kpis.ongoing}
            icon={Clock}
            variant="default"
          />
          <KPICard
            title="Delayed"
            value={kpis.delayed}
            icon={AlertTriangle}
            variant="destructive"
          />
          <KPICard
            title="Fund Utilization"
            value={`${kpis.fundUtilization}%`}
            icon={DollarSign}
            variant="default"
          />
        </div>

        {/* Charts and Tables Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* District Comparison Chart */}
          {isStateOfficial && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>District-wise Performance</CardTitle>
                <CardDescription>Project completion and delay comparison across districts</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={districtData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="district" className="text-xs" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="hsl(var(--success))" name="Completion %" />
                    <Bar dataKey="delayed" fill="hsl(var(--destructive))" name="Delayed Projects" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Active Projects Table */}
          <Card className={isStateOfficial ? "md:col-span-2" : "md:col-span-2"}>
            <CardHeader>
              <CardTitle>
                {isStateOfficial ? "Recent Projects" : "Active Projects"}
              </CardTitle>
              <CardDescription>
                {isStateOfficial 
                  ? "Latest projects across all districts" 
                  : `Projects in ${profile.assigned_district}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    {isStateOfficial && <TableHead>District</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SAMPLE_PROJECTS
                    .filter((p) => !profile.assigned_district || p.district === profile.assigned_district)
                    .slice(0, 5)
                    .map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        {isStateOfficial && <TableCell>{project.district}</TableCell>}
                        <TableCell>
                          <Badge variant={statusVariant(project.status)}>
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={project.completion_percentage} className="w-20" />
                            <span className="text-xs text-muted-foreground">
                              {project.completion_percentage}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{(project.budget_allocated / 100000).toFixed(1)}L
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Alerts Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Active Alerts
              </CardTitle>
              <CardDescription>Critical issues requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {SAMPLE_ALERTS
                  .filter((a) => !profile.assigned_district || a.district === profile.assigned_district)
                  .slice(0, 3)
                  .map((alert) => (
                    <div key={alert.id} className="border-l-4 border-destructive pl-4 py-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{alert.district}</p>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Citizen Feedback Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Citizen Feedback
              </CardTitle>
              <CardDescription>Recent feedback and complaints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {SAMPLE_FEEDBACK
                  .filter((f) => !profile.assigned_district || f.district === profile.assigned_district)
                  .slice(0, 3)
                  .map((feedback) => (
                    <div key={feedback.id} className="border-l-4 border-accent pl-4 py-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm capitalize">{feedback.feedback_type}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {feedback.description.substring(0, 60)}...
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {feedback.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
