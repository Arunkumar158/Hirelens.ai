import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardStats from './DashboardStats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { BarChart, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar } from 'recharts';
import { User, FileText, BarChart2 } from 'lucide-react';

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch admin stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });
  
  // Fetch all users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });

  // Mock for top skills chart data
  const mockTopSkills = [
    { skill: 'JavaScript', count: 15 },
    { skill: 'React', count: 12 },
    { skill: 'TypeScript', count: 10 },
    { skill: 'Node.js', count: 8 },
    { skill: 'HTML/CSS', count: 7 },
    { skill: 'Python', count: 6 },
    { skill: 'SQL', count: 5 },
    { skill: 'Git', count: 4 },
    { skill: 'AWS', count: 3 },
    { skill: 'Docker', count: 2 },
  ];

  // Mock for user roles pie chart
  const mockUserRoles = [
    { name: 'Job Seekers', value: 65, color: '#3b82f6' },
    { name: 'Recruiters', value: 30, color: '#10b981' },
    { name: 'Admins', value: 5, color: '#f59e0b' },
  ];

  // Mock for monthly analyses
  const mockMonthlyAnalyses = [
    { name: 'Jan', analyses: 12 },
    { name: 'Feb', analyses: 19 },
    { name: 'Mar', analyses: 25 },
    { name: 'Apr', analyses: 32 },
    { name: 'May', analyses: 41 },
    { name: 'Jun', analyses: 50 },
  ];

  // Dashboard stats for admin
  const dashboardStats = stats ? [
    { label: 'Total Users', value: stats.totalUsers },
    { label: 'Total Resumes', value: stats.totalResumes },
    { label: 'Total Analyses', value: stats.totalAnalyses }
  ] : [
    { label: 'Total Users', value: 0 },
    { label: 'Total Resumes', value: 0 },
    { label: 'Total Analyses', value: 0 }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      <DashboardStats stats={dashboardStats} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Skills</CardTitle>
                <CardDescription>Most common skills in analyzed resumes</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats?.topSkills || mockTopSkills}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="skill" 
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Breakdown of users by role</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats ? [
                        { name: 'Job Seekers', value: stats.jobseekerCount },
                        { name: 'Recruiters', value: stats.recruiterCount },
                        { name: 'Admins', value: stats.totalUsers - stats.jobseekerCount - stats.recruiterCount }
                      ] : mockUserRoles}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {(stats ? [
                        { name: 'Job Seekers', value: stats.jobseekerCount, color: '#3b82f6' },
                        { name: 'Recruiters', value: stats.recruiterCount, color: '#10b981' },
                        { name: 'Admins', value: stats.totalUsers - stats.jobseekerCount - stats.recruiterCount, color: '#f59e0b' }
                      ] : mockUserRoles).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Monthly Analyses</CardTitle>
              <CardDescription>Number of analyses performed per month</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockMonthlyAnalyses}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="analyses" fill="#3b82f6" name="Analyses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage platform users</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : users?.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.name || '-'}</TableCell>
                          <TableCell>{user.email || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                user.role === 'admin'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : user.role === 'recruiter'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Resume Activity</CardTitle>
              <CardDescription>Overview of resume uploads and analyses</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Week 1', uploads: 10, analyses: 8 },
                    { name: 'Week 2', uploads: 15, analyses: 12 },
                    { name: 'Week 3', uploads: 12, analyses: 10 },
                    { name: 'Week 4', uploads: 18, analyses: 15 },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="uploads" fill="#3b82f6" name="Uploads" />
                  <Bar dataKey="analyses" fill="#10b981" name="Analyses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Platform Usage</CardTitle>
              <CardDescription>Activity metrics across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <User className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Average Users</p>
                      <p className="text-2xl font-bold">24 / day</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm text-green-600 font-medium">Resumes Analyzed</p>
                      <p className="text-2xl font-bold">152 / week</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <BarChart2 className="h-8 w-8 text-amber-500 mr-3" />
                    <div>
                      <p className="text-sm text-amber-600 font-medium">Average Score</p>
                      <p className="text-2xl font-bold">67%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
