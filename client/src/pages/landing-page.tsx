import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap, Users, BarChart, Monitor, Cloud, Activity, Target } from "lucide-react";

// Simple Navbar component
function SimpleNavbar({ transparent = false }) {
  return (
    <nav className={`w-full ${transparent ? 'bg-transparent' : 'bg-white shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Monitor className="h-8 w-auto text-primary" />
            <span className="ml-2 text-xl font-bold text-primary">HireLens</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button>Sign up / Login</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Simple Footer component
function SimpleFooter() {
  return (
    <footer className="bg-gray-800 text-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">HireLens</h3>
          <p className="text-sm text-gray-400">© 2025 HireLens. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// Simplified version without auth dependency for debugging
export default function LandingPage() {
  // Simplified dashboard link - always goes to auth page
  const getDashboardLink = () => "/auth";

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <SimpleNavbar transparent />
      
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-10 gap-12 items-center">
            {/* 60% Text Column */}
            <div className="md:col-span-6">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">AI-powered</span>
                <span className="block text-blue-500">Resume Screening</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:max-w-xl">
                Get instant feedback on your resume's match with job descriptions. Improve your chances of landing interviews with AI-powered suggestions.
              </p>
              <div className="mt-8 sm:flex gap-4">
                <div className="rounded-md shadow">
                  <Link href={getDashboardLink()}>
                    <Button size="lg" className="w-full bg-blue-500 hover:bg-blue-600">
                      Upload Resume to Get Started
                    </Button>
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0">
                  <Link href="/auth">
                    <Button variant="outline" size="lg" className="w-full border-blue-500 text-blue-500 hover:bg-blue-50">
                      For Recruiters
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* 40% Image Column */}
            <div className="md:col-span-4 relative">
              <img
                className="w-full h-auto object-cover rounded-[24px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]"
                src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                alt="Modern recruitment office"
              />
            </div>
          </div>
        </div>
      </div>

      {/* The 'Three-Step' Journey */}
      <div className="bg-gray-50 py-24" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Your Journey to the Right Job
            </h2>
          </div>

          <div className="relative">
            {/* Dashed connector line for desktop */}
            <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] border-t-2 border-dashed border-gray-300 z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
              {/* Step 1 */}
              <div className="text-center flex flex-col items-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-center h-24 w-24 rounded-full bg-blue-50 text-blue-500 mb-6 mx-auto">
                  <Cloud className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-gray-900">1. Upload</h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  Upload your resume in standard PDF format to our secure platform.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center flex flex-col items-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-center h-24 w-24 rounded-full bg-blue-50 text-blue-500 mb-6 mx-auto">
                  <Activity className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-gray-900">2. Analyze</h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  Our AI scans your skills against the target job description.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center flex flex-col items-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-center h-24 w-24 rounded-full bg-blue-50 text-blue-500 mb-6 mx-auto">
                  <Target className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-gray-900">3. Match</h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  Get structural feedback, instant matches, and improvement tips.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Features Section */}
      <div className="py-24 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base text-blue-500 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Streamline Your Hiring Process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 - Large spanning col */}
            <div className="md:col-span-2 bg-white rounded-3xl border border-gray-200 p-8 shadow-sm transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-blue-50 text-blue-500 mb-6">
                <CheckCircle className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">Resume-Job Match Analysis</h3>
              <p className="text-lg leading-relaxed text-slate-600">
                Get an instant analysis of how well your resume matches a specific job description, with a detailed breakdown of matching and missing skills.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-blue-50 text-blue-500 mb-6">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-4">Actionable Improvement Tips</h3>
              <p className="text-base leading-relaxed text-slate-600">
                Receive personalized suggestions to improve your resume for specific job roles, highlighting areas that need attention.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-blue-50 text-blue-500 mb-6">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-4">Bulk Resume Screening</h3>
              <p className="text-base leading-relaxed text-slate-600">
                Screen multiple resumes at once against a job description, automatically ranking candidates based on skills match.
              </p>
            </div>

            {/* Feature 4 - Large spanning col */}
            <div className="md:col-span-2 bg-white rounded-3xl border border-gray-200 p-8 shadow-sm transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-blue-50 text-blue-500 mb-6">
                <BarChart className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">Visual Insights & Analytics</h3>
              <p className="text-lg leading-relaxed text-slate-600">
                Get powerful visualizations of skills distribution, candidate comparisons, and detailed analytics to make informed hiring decisions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-10">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Testimonials</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              What Our Users Say
            </p>
          </div>
          
          <div className="mt-10 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-1">
              <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden p-6 flex flex-col">
                <div className="flex-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="mt-4 text-gray-600">
                    "HireLens helped me identify critical skills missing from my resume. After making the suggested changes, I started getting more interview calls. Highly recommended!"
                  </p>
                </div>
                <div className="mt-6 flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      SJ
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Sarah J.</p>
                    <p className="text-sm text-gray-500">Software Engineer</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden p-6 flex flex-col">
                <div className="flex-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="mt-4 text-gray-600">
                    "As a hiring manager, HireLens has cut our initial screening time in half. The skill matching and candidate ranking features are game-changers for our recruitment process."
                  </p>
                </div>
                <div className="mt-6 flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      MT
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Michael T.</p>
                    <p className="text-sm text-gray-500">HR Director</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden p-6 flex flex-col">
                <div className="flex-1">
                  <div className="flex items-center">
                    {[...Array(4)].map((_, i) => (
                      <svg key={i} className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <svg className="h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-gray-600">
                    "I used HireLens to prepare for my career switch. The platform helped me identify transferable skills and highlight them effectively in my resume."
                  </p>
                </div>
                <div className="mt-6 flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      AR
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Alex R.</p>
                    <p className="text-sm text-gray-500">Marketing Specialist</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to boost your job search?</span>
            <span className="block text-primary-200">Start your free trial today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link href="/auth">
                <Button variant="secondary" size="lg">
                  Get started
                </Button>
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link href="/#features">
                <Button variant="outline" size="lg" className="bg-primary-600 text-white border-primary-500 hover:bg-primary-700 hover:text-white">
                  Learn more
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <SimpleFooter />
    </div>
  );
}
