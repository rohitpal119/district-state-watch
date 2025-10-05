import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, BarChart3, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary rounded-2xl shadow-lg">
              <Building2 className="h-16 w-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            PM-AJAY Dashboard
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Role-based Monitoring and Management System for PM-AJAY Projects
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
            Access Dashboard
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
          <Card>
            <CardHeader>
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-2">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Real-time Analytics</CardTitle>
              <CardDescription>
                Track project progress, fund utilization, and performance metrics across all districts
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-3 bg-accent/10 rounded-lg w-fit mb-2">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Role-based Access</CardTitle>
              <CardDescription>
                Secure dashboards for State Officials and District Collectors with appropriate permissions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-3 bg-success/10 rounded-lg w-fit mb-2">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <CardTitle>Predictive Alerts</CardTitle>
              <CardDescription>
                Early warning system for project delays, fund issues, and quality concerns
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/5 to-accent/5 border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Get Started Today</CardTitle>
              <CardDescription className="text-base">
                Sign in to access your role-specific dashboard and start monitoring PM-AJAY projects
              </CardDescription>
              <div className="pt-4">
                <Button size="lg" onClick={() => navigate("/auth")} variant="default">
                  Sign In / Create Account
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
