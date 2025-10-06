import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SAMPLE_PROJECTS } from "@/lib/sampleData";
import { ArrowLeft, Building2, Hammer, Calendar, IndianRupee, TrendingUp, Image as ImageIcon } from "lucide-react";

const ProjectDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const project = SAMPLE_PROJECTS.find(p => p.id === id);

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

  if (!profile || !project) return null;

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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground mt-1">{project.district} District</p>
          </div>
          <Badge variant={statusVariant(project.status)} className="text-sm">
            {project.status}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Responsible Agency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{project.agency}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hammer className="h-5 w-5" />
                Contractor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{project.contractor}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{new Date(project.start_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{new Date(project.end_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <IndianRupee className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Budget Allocated</p>
                  <p className="font-medium">₹{(project.budget_allocated / 100000).toFixed(2)}L</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <IndianRupee className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fund Utilized</p>
                  <p className="font-medium">₹{(project.fund_utilized / 100000).toFixed(2)}L</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <p className="font-medium">{project.completion_percentage}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              AR & 360° Progress Monitoring
            </CardTitle>
            <CardDescription>
              View real-time site progress through augmented reality and 360-degree images
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.ar_images && project.ar_images.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">AR View</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {project.ar_images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-video rounded-lg border bg-muted cursor-pointer overflow-hidden hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(img)}
                    >
                      <img src={img} alt={`AR View ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <p className="text-white font-medium">AR View Available</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {project.progress_updates && project.progress_updates.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Progress Updates (360° Images)</h3>
                <div className="space-y-4">
                  {project.progress_updates.map((update, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{update.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(update.date).toLocaleDateString('en-IN', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      {update.image_360 && (
                        <div
                          className="relative aspect-video rounded-lg border bg-muted cursor-pointer overflow-hidden hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedImage(update.image_360)}
                        >
                          <img src={update.image_360} alt="360° View" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <p className="text-white font-medium">360° View Available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl w-full">
              <img src={selectedImage} alt="Full view" className="w-full rounded-lg" />
              <Button
                variant="secondary"
                className="absolute top-4 right-4"
                onClick={() => setSelectedImage(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetail;
