import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_FEEDBACK, SAMPLE_PROJECTS } from "@/lib/sampleData";
import { MessageSquare } from "lucide-react";

const Feedback = () => {
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

  const filteredFeedback = SAMPLE_FEEDBACK.filter(
    (f) => !profile.assigned_district || f.district === profile.assigned_district
  );

  const typeVariant = (type: string) => {
    switch (type) {
      case "complaint": return "destructive";
      case "query": return "default";
      case "suggestion": return "secondary";
      case "appreciation": return "outline";
      default: return "outline";
    }
  };

  const getProjectName = (projectId: string) => {
    return SAMPLE_PROJECTS.find((p) => p.id === projectId)?.name || "N/A";
  };

  return (
    <DashboardLayout 
      userRole={profile.role} 
      userDistrict={profile.assigned_district}
      userEmail={profile.email}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Citizen Feedback</h1>
            <p className="text-muted-foreground mt-1">Track and respond to citizen concerns</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feedback & Complaints</CardTitle>
            <CardDescription>
              {filteredFeedback.length} feedback submission(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Citizen Name</TableHead>
                  {profile.role === "state_official" && <TableHead>District</TableHead>}
                  <TableHead>Project</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedback.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell>
                      <Badge variant={typeVariant(feedback.feedback_type)}>
                        {feedback.feedback_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{feedback.citizen_name || "Anonymous"}</TableCell>
                    {profile.role === "state_official" && <TableCell>{feedback.district}</TableCell>}
                    <TableCell>{getProjectName(feedback.project_id || "")}</TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate">{feedback.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {feedback.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{feedback.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>{new Date(feedback.created_at).toLocaleDateString()}</TableCell>
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

export default Feedback;
