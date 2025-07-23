import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useUnifiedAuth';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

type DonationCategory = {
  id: string;
  name: string;
  description: string | null;
  total_amount: number;
};

type MonthlyData = {
  month: string;
  year: number;
  total_amount: number;
  donation_count: number;
};

type DonorSummary = {
  member_id: string | null;
  member_name: string | null;
  email: string | null;
  total_amount: number;
  donation_count: number;
  is_anonymous: boolean;
};

export default function Reports() {
  const { memberRole } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [categoryData, setCategoryData] = useState<DonationCategory[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [donorData, setDonorData] = useState<DonorSummary[]>([]);
  const [yearlyTotals, setYearlyTotals] = useState({
    totalDonations: 0,
    totalDonors: 0,
    averageDonation: 0,
    anonymousDonations: 0
  });

  useEffect(() => {
    fetchReportData();
  }, [reportYear]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch donations for the year with category and member info
      const { data: donations, error: donationsError } = await supabase
        .from('donations')
        .select(`
          amount,
          donation_date,
          category_id,
          member_id,
          donation_categories!inner(id, name, description),
          members(first_name, last_name, email)
        `)
        .gte('donation_date', `${reportYear}-01-01`)
        .lt('donation_date', `${reportYear + 1}-01-01`)
        .order('donation_date');

      if (donationsError) throw donationsError;

      // Process category totals
      const categoryTotals = new Map<string, { name: string; description: string | null; total: number }>();
      
      // Process monthly data
      const monthlyTotals = new Map<string, { total: number; count: number }>();
      
      // Process donor data
      const donorTotals = new Map<string, { 
        name: string | null; 
        email: string | null; 
        total: number; 
        count: number; 
        isAnonymous: boolean 
      }>();

      donations?.forEach(donation => {
        const donationAmount = donation.amount;
        const donationDate = new Date(donation.donation_date);
        const monthKey = `${donationDate.getFullYear()}-${String(donationDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Category totals
        const categoryId = donation.category_id;
        const categoryName = donation.donation_categories?.name || 'Unknown';
        const categoryDesc = donation.donation_categories?.description || null;
        
        if (!categoryTotals.has(categoryId)) {
          categoryTotals.set(categoryId, { name: categoryName, description: categoryDesc, total: 0 });
        }
        categoryTotals.get(categoryId)!.total += donationAmount;

        // Monthly totals
        if (!monthlyTotals.has(monthKey)) {
          monthlyTotals.set(monthKey, { total: 0, count: 0 });
        }
        const monthData = monthlyTotals.get(monthKey)!;
        monthData.total += donationAmount;
        monthData.count += 1;

        // Donor totals
        const donorKey = donation.member_id || 'anonymous';
        const donorName = donation.members ? 
          `${donation.members.first_name} ${donation.members.last_name}` : null;
        const donorEmail = donation.members?.email || null;
        const isAnonymous = !donation.member_id;

        if (!donorTotals.has(donorKey)) {
          donorTotals.set(donorKey, { 
            name: donorName, 
            email: donorEmail, 
            total: 0, 
            count: 0, 
            isAnonymous 
          });
        }
        const donorInfo = donorTotals.get(donorKey)!;
        donorInfo.total += donationAmount;
        donorInfo.count += 1;
      });

      // Convert maps to arrays
      const categoryArray: DonationCategory[] = Array.from(categoryTotals.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        description: data.description,
        total_amount: data.total
      }));

      const monthlyArray: MonthlyData[] = Array.from(monthlyTotals.entries()).map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-');
        return {
          month: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long' }),
          year: parseInt(year),
          total_amount: data.total,
          donation_count: data.count
        };
      });

      const donorArray: DonorSummary[] = Array.from(donorTotals.entries()).map(([key, data]) => ({
        member_id: key === 'anonymous' ? null : key,
        member_name: data.name,
        email: data.email,
        total_amount: data.total,
        donation_count: data.count,
        is_anonymous: data.isAnonymous
      })).sort((a, b) => b.total_amount - a.total_amount);

      // Calculate yearly totals
      const totalDonations = donations?.reduce((sum, d) => sum + d.amount, 0) || 0;
      const totalDonors = donorTotals.size;
      const averageDonation = donations?.length ? totalDonations / donations.length : 0;
      const anonymousDonations = donorArray.find(d => d.is_anonymous)?.total_amount || 0;

      setCategoryData(categoryArray);
      setMonthlyData(monthlyArray);
      setDonorData(donorArray);
      setYearlyTotals({
        totalDonations,
        totalDonors,
        averageDonation,
        anonymousDonations
      });

    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const generatePDF = () => {
    const printContent = document.getElementById('report-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Annual Donation Report ${reportYear}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f5f5f5; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
        <div className="flex gap-3 items-center">
          <select
            value={reportYear}
            onChange={(e) => setReportYear(parseInt(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={generatePDF}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Print Report
          </button>
        </div>
      </div>

      <div id="report-content">
        {/* Report Header */}
        <div className="header bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Annual Donation Report
          </h2>
          <p className="text-center text-gray-600 mt-2">
            Tax Year {reportYear} • Church Financial Summary
          </p>
          <p className="text-center text-sm text-gray-500 mt-1">
            Generated on {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Summary Statistics */}
        <div className="stats-grid grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">$</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Donations</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(yearlyTotals.totalDonations)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">#</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Donors</dt>
                    <dd className="text-lg font-medium text-gray-900">{yearlyTotals.totalDonors}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">avg</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Average Donation</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(yearlyTotals.averageDonation)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">?</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Anonymous</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(yearlyTotals.anonymousDonations)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Donations by Category */}
        <div className="section bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Donations by Category</h3>
          <div className="overflow-x-auto">
            <table className="table min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryData.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {category.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(category.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {((category.total_amount / yearlyTotals.totalDonations) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div className="section bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="table min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Number of Donations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average per Donation
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyData.map((month, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {month.month} {month.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(month.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {month.donation_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(month.total_amount / month.donation_count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Donors (Admin/Pastor only) */}
        {(memberRole === 'admin' || memberRole === 'pastor') && (
          <div className="section bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Donor Summary (Top 20)</h3>
            <div className="overflow-x-auto">
              <table className="table min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Donor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Donated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Number of Donations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average per Donation
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {donorData.slice(0, 20).map((donor, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {donor.is_anonymous ? (
                          <span className="text-gray-500 italic">Anonymous</span>
                        ) : (
                          donor.member_name || 'Unknown'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {donor.is_anonymous ? '-' : (donor.email || '-')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(donor.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {donor.donation_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(donor.total_amount / donor.donation_count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Compliance Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Tax Compliance Notice
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This report provides a summary of donations received during the {reportYear} tax year. 
                  Individual donation receipts should be provided to donors for tax deduction purposes. 
                  Consult with a qualified accountant or tax professional for specific compliance requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}