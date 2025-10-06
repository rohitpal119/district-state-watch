import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import DashboardLayout from "@/components/layout/DashboardLayout";
import KPICard from "@/components/dashboard/KPICard";
import { 
  Building2, 
  Upload,
  MessageSquare,
  DollarSign,
  Activity,
  Camera,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Profile {
  role: "contractor";
  assigned_district: string | null;
  email: string;
}

const ContractorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [fundDescription, setFundDescription] = useState("");

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
      
      if (data.role !== "contractor") {
        navigate("/dashboard");
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

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;
    
    try {
      const { error } = await supabase
        .from("contractor_communications")
        .insert({
          contractor_id: user.id,
          message: message.trim(),
          sender_type: "contractor",
        });

      if (error) throw error;
      toast.success("Message sent successfully");
      setMessage("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleFundUpdate = async () => {
    if (!fundAmount || !fundDescription.trim() || !user) {
      toast.error("Please fill in all required fields");
      return;
    }

    toast.info("Please select a project first to submit fund updates");
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

  return (
    <DashboardLayout 
      userRole={profile.role} 
      userDistrict={profile.assigned_district}
      userEmail={profile.email}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contractor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your projects, communicate with officials, and submit updates
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <KPICard
            title="Assigned Projects"
            value={0}
            icon={Building2}
            variant="default"
          />
          <KPICard
            title="Pending Updates"
            value={0}
            icon={Upload}
            variant="warning"
          />
          <KPICard
            title="Messages"
            value={0}
            icon={MessageSquare}
            variant="default"
          />
          <KPICard
            title="Fund Status"
            value="₹0"
            icon={DollarSign}
            variant="success"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="projects">My Projects</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="updates">Submit Updates</TabsTrigger>
            <TabsTrigger value="feedback">Citizen Feedback</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Projects</CardTitle>
                <CardDescription>Projects currently assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No projects assigned yet
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Send Message</CardTitle>
                  <CardDescription>Communicate with District Collector</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Type your message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <Button onClick={handleSendMessage} className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Messages</CardTitle>
                  <CardDescription>Your communication history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center text-muted-foreground py-8">
                      No messages yet
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Updates Tab */}
          <TabsContent value="updates" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Progress Images</CardTitle>
                  <CardDescription>Upload AR, 360°, or progress photos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image-type">Image Type</Label>
                    <select 
                      id="image-type"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="progress">Progress Photo</option>
                      <option value="ar">AR Image</option>
                      <option value="360">360° Image</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image-upload">Upload Image</Label>
                    <Input id="image-upload" type="file" accept="image/*" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image-description">Description</Label>
                    <Textarea
                      id="image-description"
                      placeholder="Describe the progress..."
                      rows={3}
                    />
                  </div>
                  <Button className="w-full">
                    <Camera className="mr-2 h-4 w-4" />
                    Upload Image
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Submit Fund Update</CardTitle>
                  <CardDescription>Request fund release or submit expense report</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fund-amount">Amount (₹)</Label>
                    <Input
                      id="fund-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fund-description">Description</Label>
                    <Textarea
                      id="fund-description"
                      placeholder="Describe the expense or fund request..."
                      value={fundDescription}
                      onChange={(e) => setFundDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receipt-upload">Upload Receipt (Optional)</Label>
                    <Input id="receipt-upload" type="file" accept="image/*,.pdf" />
                  </div>
                  <Button onClick={handleFundUpdate} className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Submit Fund Update
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
                <CardDescription>Your submitted updates and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No updates submitted yet
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Citizen Feedback</CardTitle>
                <CardDescription>Feedback related to your projects</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Feedback Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No feedback received yet
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ContractorDashboard;
