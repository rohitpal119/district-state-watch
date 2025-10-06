import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SAMPLE_PROJECTS, DISTRICTS } from "@/lib/sampleData";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";

const Projects = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");

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

  const filteredProjects = SAMPLE_PROJECTS
    .filter((p) => !profile.assigned_district || p.district === profile.assigned_district)
    .filter((p) => searchTerm === "" || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((p) => statusFilter === "all" || p.status === statusFilter)
    .filter((p) => districtFilter === "all" || p.district === districtFilter);

  const handleExport = () => {
    toast.success("Export functionality will be implemented");
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">View and manage all projects</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project List</CardTitle>
            <CardDescription>
              {filteredProjects.length} project(s) found
            </CardDescription>
            <div className="flex gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                </SelectContent>
              </Select>
              {profile.role === "state_official" && (
                <Select value={districtFilter} onValueChange={setDistrictFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="District" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  {profile.role === "state_official" && <TableHead>District</TableHead>}
                  <TableHead>Agency</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Budget Allocated</TableHead>
                  <TableHead className="text-right">Fund Utilized</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow 
                    key={project.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <TableCell className="font-medium">{project.name}</TableCell>
                    {profile.role === "state_official" && <TableCell>{project.district}</TableCell>}
                    <TableCell>{project.agency}</TableCell>
                    <TableCell>{new Date(project.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(project.status)}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{project.completion_percentage}%</TableCell>
                    <TableCell className="text-right">₹{(project.budget_allocated / 100000).toFixed(2)}L</TableCell>
                    <TableCell className="text-right">₹{(project.fund_utilized / 100000).toFixed(2)}L</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Projects;
