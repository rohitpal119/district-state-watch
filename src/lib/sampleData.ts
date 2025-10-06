export const DISTRICTS = [
  "Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad",
  "Thane", "Solapur", "Amravati", "Kolhapur", "Sangli"
];

export const SAMPLE_PROJECTS = [
  {
    id: "1",
    name: "Rural Road Development Phase 1",
    district: "Mumbai",
    agency: "PWD Maharashtra",
    contractor: "Kumar Construction Ltd.",
    start_date: "2024-01-15",
    end_date: "2025-06-30",
    status: "ongoing",
    budget_allocated: 5000000,
    fund_utilized: 3200000,
    completion_percentage: 64,
    ar_images: ["/placeholder.svg"],
    progress_updates: [
      { date: "2024-09-01", description: "Road foundation completed for 5km stretch", image_360: "/placeholder.svg" },
      { date: "2024-08-15", description: "Site leveling and marking completed", image_360: "/placeholder.svg" }
    ]
  },
  {
    id: "2",
    name: "School Infrastructure Upgrade",
    district: "Pune",
    agency: "Education Department",
    contractor: "Singh Builders Pvt. Ltd.",
    start_date: "2024-03-01",
    end_date: "2024-12-31",
    status: "delayed",
    budget_allocated: 2500000,
    fund_utilized: 1800000,
    completion_percentage: 55,
    ar_images: ["/placeholder.svg"],
    progress_updates: [
      { date: "2024-09-20", description: "Classroom renovation ongoing - 6 rooms completed", image_360: "/placeholder.svg" }
    ]
  },
  {
    id: "3",
    name: "Water Supply Network Expansion",
    district: "Nagpur",
    agency: "Water Resources Dept",
    contractor: "Aqua Solutions Infrastructure",
    start_date: "2023-11-01",
    end_date: "2024-10-31",
    status: "completed",
    budget_allocated: 8000000,
    fund_utilized: 7850000,
    completion_percentage: 100,
    ar_images: ["/placeholder.svg"],
    progress_updates: [
      { date: "2024-10-31", description: "Project completed - 15km pipeline network installed", image_360: "/placeholder.svg" },
      { date: "2024-09-15", description: "Final testing and commissioning", image_360: "/placeholder.svg" }
    ]
  },
  {
    id: "4",
    name: "Health Center Modernization",
    district: "Nashik",
    agency: "Health Department",
    contractor: "Medibuild Construction Co.",
    start_date: "2024-02-01",
    end_date: "2025-01-31",
    status: "ongoing",
    budget_allocated: 3500000,
    fund_utilized: 2100000,
    completion_percentage: 60,
    ar_images: ["/placeholder.svg"],
    progress_updates: [
      { date: "2024-09-25", description: "OPD wing renovation completed", image_360: "/placeholder.svg" }
    ]
  },
  {
    id: "5",
    name: "Digital Infrastructure Setup",
    district: "Mumbai",
    agency: "IT Department",
    contractor: "Tech Solutions India Pvt. Ltd.",
    start_date: "2024-04-01",
    end_date: "2025-03-31",
    status: "ongoing",
    budget_allocated: 4200000,
    fund_utilized: 1500000,
    completion_percentage: 35,
    ar_images: ["/placeholder.svg"],
    progress_updates: [
      { date: "2024-09-30", description: "Network cabling completed in 3 buildings", image_360: "/placeholder.svg" }
    ]
  }
];

export const SAMPLE_ALERTS = [
  {
    id: "1",
    project_id: "2",
    district: "Pune",
    alert_type: "delay",
    severity: "high",
    title: "Project Timeline Delay",
    description: "School Infrastructure Upgrade is 2 weeks behind schedule due to material shortage",
    status: "active",
    created_at: "2024-10-01T10:30:00Z"
  },
  {
    id: "2",
    project_id: "5",
    district: "Mumbai",
    alert_type: "fund_issue",
    severity: "medium",
    title: "Fund Utilization Below Target",
    description: "Digital Infrastructure project has utilized only 35% of allocated funds",
    status: "active",
    created_at: "2024-10-03T14:20:00Z"
  },
  {
    id: "3",
    project_id: "1",
    district: "Mumbai",
    alert_type: "quality_concern",
    severity: "critical",
    title: "Quality Inspection Failed",
    description: "Recent inspection revealed substandard material usage in road construction",
    status: "active",
    created_at: "2024-10-04T09:15:00Z"
  }
];

export const SAMPLE_FEEDBACK = [
  {
    id: "1",
    project_id: "1",
    district: "Mumbai",
    citizen_name: "Rajesh Kumar",
    feedback_type: "complaint",
    description: "Road construction work is causing severe traffic congestion during peak hours",
    status: "in_progress",
    priority: "high",
    created_at: "2024-09-28T11:00:00Z"
  },
  {
    id: "2",
    project_id: "4",
    district: "Nashik",
    citizen_name: "Priya Sharma",
    feedback_type: "appreciation",
    description: "Excellent progress on health center upgrades. Staff is very cooperative",
    status: "resolved",
    priority: "low",
    created_at: "2024-09-30T15:30:00Z"
  },
  {
    id: "3",
    project_id: "2",
    district: "Pune",
    citizen_name: "Amit Patel",
    feedback_type: "query",
    description: "When will the school infrastructure work be completed? Classes are affected",
    status: "pending",
    priority: "medium",
    created_at: "2024-10-02T08:45:00Z"
  }
];

export const calculateKPIs = (projects: typeof SAMPLE_PROJECTS, district?: string) => {
  const filteredProjects = district
    ? projects.filter((p) => p.district === district)
    : projects;

  const totalProjects = filteredProjects.length;
  const completed = filteredProjects.filter((p) => p.status === "completed").length;
  const ongoing = filteredProjects.filter((p) => p.status === "ongoing").length;
  const delayed = filteredProjects.filter((p) => p.status === "delayed").length;

  const totalBudget = filteredProjects.reduce((sum, p) => sum + p.budget_allocated, 0);
  const totalUtilized = filteredProjects.reduce((sum, p) => sum + p.fund_utilized, 0);
  const utilizationPercent = totalBudget > 0 ? ((totalUtilized / totalBudget) * 100).toFixed(1) : "0";

  return {
    totalProjects,
    completedPercent: totalProjects > 0 ? ((completed / totalProjects) * 100).toFixed(1) : "0",
    ongoing,
    delayed,
    fundUtilization: utilizationPercent,
  };
};
