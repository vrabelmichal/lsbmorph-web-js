import React from 'react';
import { GetServerSideProps } from 'next';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Layout } from '../components/layout/Layout';
import { verifyToken } from '../lib/auth';
import { prisma } from '../lib/db';

interface ResultsProps {
  stats: {
    totalClassified: number;
    lsbCount: number;
    awesomeCount: number;
    lsbCounts: { failed: number; nonLsb: number; lsb: number };
    morphCounts: { featureless: number; notSure: number; ltg: number; etg: number };
    recentClassifications: any[];
  };
}

export default function Results({ stats }: ResultsProps) {
  const lsbData = [
    { name: 'Failed fitting', value: stats.lsbCounts.failed, color: '#ef4444' },
    { name: 'Non-LSB', value: stats.lsbCounts.nonLsb, color: '#3b82f6' },
    { name: 'LSB', value: stats.lsbCounts.lsb, color: '#10b981' },
  ];

  const morphData = [
    { name: 'Featureless', value: stats.morphCounts.featureless, color: '#ef4444' },
    { name: 'Not sure', value: stats.morphCounts.notSure, color: '#3b82f6' },
    { name: 'LTG (Sp)', value: stats.morphCounts.ltg, color: '#10b981' },
    { name: 'ETG (Ell)', value: stats.morphCounts.etg, color: '#8b5cf6' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Your Classification Statistics</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl font-bold text-blue-600">{stats.totalClassified}</div>
            <div className="text-gray-600">Galaxies Classified</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl font-bold text-green-600">{stats.lsbCount}</div>
            <div className="text-gray-600">LSB Galaxies Found</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl font-bold text-purple-600">{stats.awesomeCount}</div>
            <div className="text-gray-600">Awesome Galaxies</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">LSB Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={lsbData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {lsbData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Morphology Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={morphData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {morphData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Classifications Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Recent Classifications</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Galaxy ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">LSB Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Morphology</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentClassifications.map((classification) => (
                  <tr key={classification.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{classification.galaxyId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {classification.lsbClass === -1 ? 'Failed fitting' :
                       classification.lsbClass === 0 ? 'Non-LSB' : 'LSB'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {classification.morphology === -1 ? 'Featureless' :
                       classification.morphology === 0 ? 'Not sure' :
                       classification.morphology === 1 ? 'LTG (Sp)' : 'ETG (Ell)'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(classification.dateClassified).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a href={`/classify/${classification.galaxyId}`} className="text-blue-600 hover:underline">
                        View Again
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await verifyToken(context.req as any);
  if (!user) {
    return { redirect: { destination: '/', permanent: false } };
  }

  // Fetch statistics from database
  const stats = {
    totalClassified: await prisma.classification.count({ where: { userId: user.userId } }),
    lsbCount: await prisma.classification.count({ where: { userId: user.userId, lsbClass: 1 } }),
    awesomeCount: await prisma.classification.count({ where: { userId: user.userId, awesomeFlag: true } }),
    lsbCounts: {
      failed: await prisma.classification.count({ where: { userId: user.userId, lsbClass: -1 } }),
      nonLsb: await prisma.classification.count({ where: { userId: user.userId, lsbClass: 0 } }),
      lsb: await prisma.classification.count({ where: { userId: user.userId, lsbClass: 1 } }),
    },
    morphCounts: {
      featureless: await prisma.classification.count({ where: { userId: user.userId, morphology: -1 } }),
      notSure: await prisma.classification.count({ where: { userId: user.userId, morphology: 0 } }),
      ltg: await prisma.classification.count({ where: { userId: user.userId, morphology: 1 } }),
      etg: await prisma.classification.count({ where: { userId: user.userId, morphology: 2 } }),
    },
    recentClassifications: await prisma.classification.findMany({
      where: { userId: user.userId },
      orderBy: { dateClassified: 'desc' },
      take: 10,
    }),
  };

  return { props: { stats } };
};
