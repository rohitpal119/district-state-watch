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
  FileText,
  Eye
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Profile {
  role: "contractor";
  assigned_district: string | null;
  email: string;
  full_name: string;
}

interface Project {
  id: string;
  name: string;
  district: string;
  status: string;
  completion_percentage: number;
  budget_allocated: number;
  fund_utilized: number;
  agency: string;
  start_date: string;
  end_date: string;
}

interface Communication {
  id: string;
  message: string;
  sender_type: string;
  created_at: string;
  read: boolean;
}

interface FundUpdate {
  id: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
  receipt_url: string | null;
}

interface Feedback {
  id: string;
  feedback_type: string;
  description: string;
  priority: string;
  status: string;
  citizen_name: string | null;
  created_at: string;
}

const ContractorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [fundUpdates, setFundUpdates] = useState<FundUpdate[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  
  // Form states
  const [message, setMessage] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [fundDescription, setFundDescription] = useState("");
  const [imageType, setImageType] = useState("progress");
  const [imageDescription, setImageDescription] = useState("");

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
    }
  }, [user]);

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
        full_name: data.full_name,
      });
      
      // Fetch all contractor data
      await Promise.all([
        fetchProjects(),
        fetchCommunications(),
        fetchFundUpdates(),
        fetchFeedback(),
        fetchAvailableProjects()
      ]);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("contractor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchAvailableProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .is("contractor_id", null)
        .eq("status", "ongoing")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAvailableProjects(data || []);
    } catch (error) {
      console.error("Error fetching available projects:", error);
    }
  };

  const fetchCommunications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("contractor_communications")
        .select("*")
        .eq("contractor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCommunications(data || []);
    } catch (error) {
      console.error("Error fetching communications:", error);
    }
  };

  const fetchFundUpdates = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("contractor_fund_updates")
        .select("*")
        .eq("contractor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFundUpdates(data || []);
    } catch (error) {
      console.error("Error fetching fund updates:", error);
    }
  };

  const fetchFeedback = async () => {
    if (!user || projects.length === 0) return;
    
    try {
      const projectIds = projects.map(p => p.id);
      const { data, error } = await supabase
        .from("citizen_feedback")
        .select("*")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !selectedProject) {
      toast.error("Please select a project and enter a message");
      return;
    }
    
    try {
      // Get district collector ID for the project
      const project = projects.find(p => p.id === selectedProject);
      if (!project) {
        toast.error("Project not found");
        return;
      }

      const { error } = await supabase
        .from("contractor_communications")
        .insert({
          contractor_id: user.id,
          project_id: selectedProject,
          message: message.trim(),
          sender_type: "contractor",
        });

      if (error) throw error;
      toast.success("Message sent successfully");
      setMessage("");
      fetchCommunications();
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleFundUpdate = async () => {
    if (!fundAmount || !fundDescription.trim() || !user || !selectedProject) {
      toast.error("Please fill in all required fields and select a project");
      return;
    }

    try {
      const { error } = await supabase
        .from("contractor_fund_updates")
        .insert({
          contractor_id: user.id,
          project_id: selectedProject,
          amount: parseFloat(fundAmount),
          description: fundDescription.trim(),
          status: "pending"
        });

      if (error) throw error;
      toast.success("Fund update submitted successfully");
      setFundAmount("");
      setFundDescription("");
      fetchFundUpdates();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit fund update");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject || !user) {
      toast.error("Please select a project first");
      return;
    }

    toast.info("Image upload feature requires storage bucket setup");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    navigate("/auth");
    return null;
  }

  if (!profile) {
    return null;
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "ongoing": return "secondary";
      case "delayed": return "destructive";
      case "approved": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  const totalFundsRequested = fundUpdates
    .filter(f => f.status === "pending")
    .reduce((sum, f) => sum + f.amount, 0);

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
            Welcome, {profile.full_name} - Manage your projects and communicate with officials
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <KPICard
            title="Assigned Projects"
            value={projects.length}
            icon={Building2}
            variant="default"
          />
          <KPICard
            title="Pending Updates"
            value={fundUpdates.filter(f => f.status === "pending").length}
            icon={Upload}
            variant="warning"
          />
          <KPICard
            title="Messages"
            value={communications.filter(c => !c.read && c.sender_type === "district_collector").length}
            icon={MessageSquare}
            variant="default"
          />
          <KPICard
            title="Funds Requested"
            value={`₹${(totalFundsRequested / 100000).toFixed(1)}L`}
            icon={DollarSign}
            variant="success"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="projects">My Projects</TabsTrigger>
            <TabsTrigger value="available">Available Projects</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="updates">Submit Updates</TabsTrigger>
            <TabsTrigger value="feedback">Citizen Feedback</TabsTrigger>
          </TabsList>

          {/* My Projects Tab */}
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
                    {projects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No projects assigned yet. Check Available Projects tab
                        </TableCell>
                      </TableRow>
                    ) : (
                      projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>{project.district}</TableCell>
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Available Projects Tab */}
          <TabsContent value="available" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Projects</CardTitle>
                <CardDescription>Upcoming projects available for bidding</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Agency</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No upcoming projects available at the moment
                        </TableCell>
                      </TableRow>
                    ) : (
                      availableProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>{project.district}</TableCell>
                          <TableCell>{project.agency}</TableCell>
                          <TableCell className="text-right">
                            ₹{(project.budget_allocated / 100000).toFixed(1)}L
                          </TableCell>
                          <TableCell>{new Date(project.start_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
                    <Label htmlFor="project-select">Select Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  <Button onClick={handleSendMessage} className="w-full" disabled={!selectedProject}>
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
                    {communications.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No messages yet
                      </div>
                    ) : (
                      communications.slice(0, 5).map((comm) => (
                        <div key={comm.id} className="border-l-4 border-primary pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm">{comm.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {comm.sender_type === "contractor" ? "You" : "District Collector"} • {new Date(comm.created_at).toLocaleString()}
                              </p>
                            </div>
                            {!comm.read && comm.sender_type === "district_collector" && (
                              <Badge variant="destructive" className="text-xs">New</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
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
                    <Label htmlFor="image-project">Select Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image-type">Image Type</Label>
                    <Select value={imageType} onValueChange={setImageType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="progress">Progress Photo</SelectItem>
                        <SelectItem value="ar">AR Image</SelectItem>
                        <SelectItem value="360">360° Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image-upload">Upload Image</Label>
                    <Input 
                      id="image-upload" 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={!selectedProject}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image-description">Description</Label>
                    <Textarea
                      id="image-description"
                      placeholder="Describe the progress..."
                      value={imageDescription}
                      onChange={(e) => setImageDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button className="w-full" disabled={!selectedProject}>
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
                    <Label htmlFor="fund-project">Select Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  <Button onClick={handleFundUpdate} className="w-full" disabled={!selectedProject}>
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
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fundUpdates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No updates submitted yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      fundUpdates.map((update) => (
                        <TableRow key={update.id}>
                          <TableCell>Fund Request</TableCell>
                          <TableCell>₹{(update.amount / 100000).toFixed(1)}L</TableCell>
                          <TableCell>{update.description.substring(0, 50)}...</TableCell>
                          <TableCell>{new Date(update.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(update.status)}>
                              {update.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
                      <TableHead>Citizen</TableHead>
                      <TableHead>Feedback Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No feedback received yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      feedback.map((fb) => (
                        <TableRow key={fb.id}>
                          <TableCell>{fb.citizen_name || "Anonymous"}</TableCell>
                          <TableCell className="capitalize">{fb.feedback_type}</TableCell>
                          <TableCell>{fb.description.substring(0, 50)}...</TableCell>
                          <TableCell>
                            <Badge variant={fb.priority === "high" ? "destructive" : "outline"}>
                              {fb.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(fb.status)}>
                              {fb.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(fb.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
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