"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building, 
  PieChart, 
  BarChart3,
  Users,
  MapPin,
  Calendar,
  Info,
  Star,
  Shield,
  Target,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Download,
  Share2
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  analyzeOwnerPortfolio, 
  formatCurrency, 
  formatPercentage,
  type OwnershipAnalysis 
} from "@/utils/propertyAnalytics";

interface WealthBreakdown {
  id: string;
  category: string;
  amount: number;
  percentage: number;
  confidence: number;
}

interface OwnerData {
  id: string;
  name: string;
  type: string;
  estimatedNetWorth: number;
  wealthConfidence: number;
  occupation: string;
  industry: string;
  wealthBreakdown: WealthBreakdown[];
  properties: Array<{
    id: string;
    address: string;
    currentValue: number;
    propertyType: string;
    city: string;
    state: string;
  }>;
}

interface WealthAnalysisData {
  owner: OwnerData;
  portfolioAnalysis: OwnershipAnalysis;
  marketComparison: {
    percentile: number;
    industryAverage: number;
    localAverage: number;
  };
  riskAssessment: {
    score: number;
    factors: string[];
    recommendations: string[];
  };
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
        <div className="h-4 bg-gray-200 rounded w-96 max-w-full"></div>
      </div>
      
      {/* Cards Skeleton */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={`skeleton-card-${i}`} className="bg-white rounded-xl border p-6 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
      
      {/* Content Skeleton */}
      <div className="space-y-6">
        <div className="h-64 bg-gray-200 rounded-xl"></div>
        <div className="h-96 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] px-4"
    >
      <div className="bg-red-50 rounded-full p-3 mb-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
        Unable to Load Wealth Analysis
      </h3>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        {error || "We encountered an error while loading the wealth analysis data. Please try again."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700">
          <Loader2 className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px] px-4"
    >
      <div className="bg-gray-100 rounded-full p-4 mb-6">
        <Users className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
        No Owner Selected
      </h3>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Please select a property owner to view their comprehensive wealth analysis and portfolio insights.
      </p>
      <Button asChild className="bg-blue-600 hover:bg-blue-700">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Dashboard
        </Link>
      </Button>
    </motion.div>
  );
}

function WealthAnalysisContent() {
  const searchParams = useSearchParams();
  const ownerId = searchParams.get("ownerId");
  const propertyId = searchParams.get("propertyId");
  
  const [analysisData, setAnalysisData] = useState<WealthAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ownerId) {
      fetchWealthAnalysis();
    } else {
      setLoading(false);
    }
  }, [ownerId]);

  const fetchWealthAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/wealth-analysis/${ownerId}${propertyId ? `?propertyId=${propertyId}` : ''}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Owner not found. This owner may have been removed or the link may be invalid.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again in a few moments.');
        } else {
          throw new Error('Failed to load wealth analysis data.');
        }
      }
      
      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      console.error('Error fetching wealth analysis:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'real_estate':
        return <Building className="h-4 w-4" />;
      case 'stocks':
      case 'bonds':
        return <TrendingUp className="h-4 w-4" />;
      case 'business':
        return <Briefcase className="h-4 w-4" />;
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <PieChart className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'real_estate': 'bg-blue-500',
      'stocks': 'bg-green-500',
      'bonds': 'bg-purple-500',
      'business': 'bg-orange-500',
      'cash': 'bg-yellow-500',
      'other': 'bg-gray-500'
    };
    return colors[category.toLowerCase() as keyof typeof colors] || 'bg-gray-500';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (confidence >= 0.6) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score <= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getRiskLevel = (score: number) => {
    if (score <= 30) return 'Low Risk';
    if (score <= 60) return 'Medium Risk';
    return 'High Risk';
  };

  if (!ownerId) {
    return (
      <DashboardLayout>
        <EmptyState />
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSkeleton />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState error={error} onRetry={fetchWealthAnalysis} />
      </DashboardLayout>
    );
  }

  if (!analysisData) {
    return (
      <DashboardLayout>
        <EmptyState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8 sm:space-y-10 lg:space-y-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-12 sm:pb-16 lg:pb-20"
      >
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild className="mt-1 flex-shrink-0 hover:bg-gray-100">
              <Link href={propertyId ? `/dashboard` : "/dashboard"}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
                Wealth Analysis
              </h1>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Comprehensive financial profile for <span className="font-semibold text-gray-900">{analysisData.owner.name}</span>
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 h-full">
              <div className="absolute top-0 right-0 w-32 h-32 -mt-16 -mr-16 bg-emerald-100 rounded-full opacity-50"></div>
              <CardHeader className="pb-4 relative">
                <CardTitle className="text-sm font-medium text-emerald-700">Net Worth</CardTitle>
              </CardHeader>
              <CardContent className="relative pb-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                      {formatCurrency(analysisData.owner.estimatedNetWorth)}
                    </p>
                    <Badge className={`text-xs border ${getConfidenceColor(analysisData.owner.wealthConfidence)}`}>
                      {Math.round(analysisData.owner.wealthConfidence * 100)}% confidence
                    </Badge>
                  </div>
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-7 w-7 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 h-full">
              <div className="absolute top-0 right-0 w-32 h-32 -mt-16 -mr-16 bg-blue-100 rounded-full opacity-50"></div>
              <CardHeader className="pb-4 relative">
                <CardTitle className="text-sm font-medium text-blue-700">Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent className="relative pb-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                      {formatCurrency(analysisData.portfolioAnalysis.portfolioValue)}
                    </p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-emerald-600 font-medium">
                        {formatPercentage(Math.abs(analysisData.portfolioAnalysis.portfolioGrowth))} growth
                      </span>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building className="h-7 w-7 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="sm:col-span-2 lg:col-span-1"
          >
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 h-full">
              <div className="absolute top-0 right-0 w-32 h-32 -mt-16 -mr-16 bg-orange-100 rounded-full opacity-50"></div>
              <CardHeader className="pb-4 relative">
                <CardTitle className="text-sm font-medium text-orange-700">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="relative pb-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                      {analysisData.riskAssessment.score}/100
                    </p>
                    <Badge className={`text-xs border ${getRiskColor(analysisData.riskAssessment.score)}`}>
                      {getRiskLevel(analysisData.riskAssessment.score)}
                    </Badge>
                  </div>
                  <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="h-7 w-7 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Owner Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                Owner Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="font-semibold text-gray-900 text-xl">{analysisData.owner.name}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <Badge variant="outline" className="capitalize text-sm px-3 py-1">
                      {analysisData.owner.type}
                    </Badge>
                  </div>
                  {analysisData.owner.occupation && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Occupation</label>
                      <p className="font-medium text-gray-900 text-lg">{analysisData.owner.occupation}</p>
                    </div>
                  )}
                  {analysisData.owner.industry && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Industry</label>
                      <p className="font-medium text-gray-900 text-lg">{analysisData.owner.industry}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-600">Wealth Percentile</label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Top {100 - analysisData.marketComparison.percentile}%</span>
                        <span className="font-medium text-lg">{analysisData.marketComparison.percentile}th percentile</span>
                      </div>
                      <Progress value={analysisData.marketComparison.percentile} className="h-4" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Properties Owned</label>
                    <p className="font-semibold text-gray-900 text-xl">{analysisData.owner.properties.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Tabs defaultValue="breakdown" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-gray-100 p-1.5 h-auto">
              <TabsTrigger value="breakdown" className="text-sm sm:text-base py-3">Wealth Breakdown</TabsTrigger>
              <TabsTrigger value="portfolio" className="text-sm sm:text-base py-3">Portfolio Analysis</TabsTrigger>
              <TabsTrigger value="properties" className="text-sm sm:text-base py-3">Properties</TabsTrigger>
              <TabsTrigger value="insights" className="text-sm sm:text-base py-3">Insights</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent key="breakdown-tab" value="breakdown" className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-xl sm:text-2xl">Wealth Distribution</CardTitle>
                      <CardDescription className="text-base text-gray-600">
                        Breakdown of estimated wealth across different asset categories
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                      <div className="space-y-5">
                        {analysisData.owner.wealthBreakdown.map((item, index) => (
                          <motion.div
                            key={`wealth-breakdown-${item.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${getCategoryColor(item.category)} flex-shrink-0`}>
                                {getCategoryIcon(item.category)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold capitalize text-gray-900 truncate text-lg">
                                  {item.category.replace('_', ' ')}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {item.percentage.toFixed(1)}% of portfolio
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-gray-900 text-xl">
                                {formatCurrency(item.amount)}
                              </p>
                              <Badge className={`text-xs border mt-1 ${getConfidenceColor(item.confidence)}`}>
                                {Math.round(item.confidence * 100)}% confident
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent key="portfolio-tab" value="portfolio" className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-xl sm:text-2xl">Portfolio Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 pb-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 font-medium">Diversification Score</span>
                          <span className="font-semibold text-lg">{analysisData.portfolioAnalysis.diversificationScore}/100</span>
                        </div>
                        <Progress value={analysisData.portfolioAnalysis.diversificationScore} className="h-3" />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 font-medium">Concentration Risk</span>
                          <span className="font-semibold text-lg">{analysisData.portfolioAnalysis.concentrationRisk}/100</span>
                        </div>
                        <Progress value={analysisData.portfolioAnalysis.concentrationRisk} className="h-3" />
                      </div>
                      
                      <div className="flex items-center justify-between py-4 border-t border-gray-100">
                        <span className="text-sm text-gray-600 font-medium">Liquidity Ratio</span>
                        <span className="font-semibold text-lg">{formatPercentage(analysisData.portfolioAnalysis.liquidityRatio)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-4 border-t border-gray-100">
                        <span className="text-sm text-gray-600 font-medium">Performance Score</span>
                        <span className="font-semibold text-lg">{analysisData.portfolioAnalysis.performanceScore}/100</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-xl sm:text-2xl">Market Comparison</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-8">
                      <div className="flex items-center justify-between py-4 border-b border-gray-100">
                        <span className="text-sm text-gray-600 font-medium">Industry Average</span>
                        <span className="font-semibold text-lg">{formatCurrency(analysisData.marketComparison.industryAverage)}</span>
                      </div>
                      <div className="flex items-center justify-between py-4 border-b border-gray-100">
                        <span className="text-sm text-gray-600 font-medium">Local Average</span>
                        <span className="font-semibold text-lg">{formatCurrency(analysisData.marketComparison.localAverage)}</span>
                      </div>
                      <div className="flex items-center justify-between py-4">
                        <span className="text-sm text-gray-600 font-medium">Wealth Percentile</span>
                        <span className="font-semibold text-lg">{analysisData.marketComparison.percentile}th</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent key="properties-tab" value="properties" className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-xl sm:text-2xl">Property Portfolio</CardTitle>
                      <CardDescription className="text-base text-gray-600">
                        Real estate holdings contributing to total wealth
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                      <div className="space-y-4">
                        {analysisData.owner.properties.map((property, index) => (
                          <motion.div
                            key={`property-${property.id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group cursor-pointer"
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                                <Building className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate text-lg">{property.address}</p>
                                <p className="text-sm text-gray-600">{property.city}, {property.state}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-gray-900 text-xl">{formatCurrency(property.currentValue)}</p>
                              <Badge variant="outline" className="text-xs capitalize mt-1">
                                {property.propertyType}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent key="insights-tab" value="insights" className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-6">
                      <CardTitle className="flex items-center gap-3 text-orange-600 text-xl">
                        <Target className="h-6 w-6" />
                        Risk Factors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-8">
                      <ul className="space-y-4">
                        {analysisData.riskAssessment.factors.map((factor, index) => (
                          <motion.li
                            key={`risk-factor-${index}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-4 text-sm p-4 bg-orange-50 rounded-lg"
                          >
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 leading-relaxed">{factor}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-6">
                      <CardTitle className="flex items-center gap-3 text-emerald-600 text-xl">
                        <CheckCircle2 className="h-6 w-6" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-8">
                      <ul className="space-y-4">
                        {analysisData.riskAssessment.recommendations.map((rec, index) => (
                          <motion.li
                            key={`recommendation-${index}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-4 text-sm p-4 bg-emerald-50 rounded-lg"
                          >
                            <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 leading-relaxed">{rec}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}

export default function WealthAnalysisPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <LoadingSkeleton />
      </DashboardLayout>
    }>
      <WealthAnalysisContent />
    </Suspense>
  );
} 