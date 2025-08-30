'use client';

import { useMemo, useState, useEffect } from 'react';
import { type CategoryTotal } from '@/lib/reports';
import { fmtMoney } from '@/lib/format';
import { ReportsAPI } from '@/lib/reports';

type Props = { 
  incomeCategories: CategoryTotal[];
  expenseCategories: CategoryTotal[];
};

type PieSlice = {
  id: string;
  label: string;
  value: number;
  percentage: number;
  startAngle: number;
  endAngle: number;
  color: string;
  isHovered: boolean;
};

type BarData = {
  month: string;
  income: number;
  expense: number;
};

export default function MonthlySeriesChart({ incomeCategories, expenseCategories }: Props) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<BarData[]>([]);
  const [loading, setLoading] = useState(true);

  // Gerçek aylık verileri al
  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoading(true);
        const series = await ReportsAPI.monthlySeries(6);
        
        const data = series.map(item => ({
          month: new Date(item.month + '-01').toLocaleDateString('tr-TR', { 
            month: 'short', 
            year: '2-digit' 
          }),
          income: Number(item.income),
          expense: Number(item.expense)
        }));
        
        setMonthlyData(data);
      } catch (error) {
        console.error('Aylık veri alınamadı:', error);
        setMonthlyData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, []);

  // Ana pasta grafiği için veri hesaplama
  const mainChartData = useMemo(() => {
    const totalIncome = incomeCategories.reduce((sum, cat) => sum + Number(cat.total), 0);
    const totalExpense = expenseCategories.reduce((sum, cat) => sum + Number(cat.total), 0);
    const total = totalIncome + totalExpense;

    if (total === 0) return [];

    const incomePercentage = (totalIncome / total) * 100;
    const expensePercentage = (totalExpense / total) * 100;

    return [
      {
        id: 'income',
        label: 'Gelir',
        value: totalIncome,
        percentage: incomePercentage,
        startAngle: 0,
        endAngle: (incomePercentage / 100) * 360,
        color: '#22C55E',
        isHovered: hoveredSlice === 'income'
      },
      {
        id: 'expense',
        label: 'Gider',
        value: totalExpense,
        percentage: expensePercentage,
        startAngle: (incomePercentage / 100) * 360,
        endAngle: 360,
        color: '#EF4444',
        isHovered: hoveredSlice === 'expense'
      }
    ];
  }, [incomeCategories, expenseCategories, hoveredSlice]);

  // Gelir kategorileri pasta grafiği
  const incomeChartData = useMemo(() => {
    const total = incomeCategories.reduce((sum, cat) => sum + Number(cat.total), 0);
    
    // Eğer hiç gelir kategorisi yoksa, "Gelir Yok" dilimi göster
    if (incomeCategories.length === 0) {
      return [{
        id: 'no-income',
        label: 'Gelir Yok',
        value: 0,
        percentage: 100,
        startAngle: 0,
        endAngle: 360,
        color: '#E5E7EB',
        isHovered: hoveredSlice === 'no-income'
      }];
    }
    
    // Toplam 0 olsa bile kategorileri göster
    const slices: PieSlice[] = [];
    let currentAngle = 0;

    incomeCategories.forEach((cat, index) => {
      const percentage = total === 0 ? 100 : (Number(cat.total) / total) * 100;
      const angle = (percentage / 100) * 360;
      const color = `hsl(${120 + index * 30}, 70%, 50%)`;
      
      slices.push({
        id: `income-${cat.name}`,
        label: cat.name,
        value: Number(cat.total),
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color,
        isHovered: hoveredSlice === `income-${cat.name}`
      });
      currentAngle += angle;
    });

    return slices;
  }, [incomeCategories, hoveredSlice]);

  // Gider kategorileri pasta grafiği
  const expenseChartData = useMemo(() => {
    const total = expenseCategories.reduce((sum, cat) => sum + Number(cat.total), 0);
    
    // Eğer hiç gider kategorisi yoksa, "Gider Yok" dilimi göster
    if (expenseCategories.length === 0) {
      return [{
        id: 'no-expense',
        label: 'Gider Yok',
        value: 0,
        percentage: 100,
        startAngle: 0,
        endAngle: 360,
        color: '#E5E7EB',
        isHovered: hoveredSlice === 'no-expense'
      }];
    }
    
    if (total === 0) return [];

    const slices: PieSlice[] = [];
    let currentAngle = 0;

    expenseCategories.forEach((cat, index) => {
      const percentage = (Number(cat.total) / total) * 100;
      const angle = (percentage / 100) * 360;
      const color = `hsl(${0 + index * 30}, 70%, 50%)`;
      
      slices.push({
        id: `expense-${cat.name}`,
        label: cat.name,
        value: Number(cat.total),
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color,
        isHovered: hoveredSlice === `expense-${cat.name}`
      });
      currentAngle += angle;
    });

    return slices;
  }, [expenseCategories, hoveredSlice]);

  // Pasta dilimi çizimi
  const createPieSlice = (slice: PieSlice, radius: number, centerX: number, centerY: number) => {
    const startRad = (slice.startAngle - 90) * (Math.PI / 180);
    const endRad = (slice.endAngle - 90) * (Math.PI / 180);
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArcFlag = slice.endAngle - slice.startAngle > 180 ? 1 : 0;
    
    const path = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    return path;
  };

  // Pasta grafiği komponenti
  const PieChart = ({ 
    data, 
    title, 
    size = 120, 
    onSliceHover 
  }: { 
    data: PieSlice[]; 
    title: string; 
    size?: number; 
    onSliceHover: (id: string | null) => void;
  }) => {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) - 10;

    return (
      <div className="flex flex-col items-center">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{title}</h4>
        <div className="relative">
          <svg width={size} height={size} className="transform transition-transform duration-200">
            {data.map((slice) => (
              <path
                key={slice.id}
                d={createPieSlice(slice, radius, centerX, centerY)}
                fill={slice.color}
                stroke="white"
                strokeWidth="2"
                className="transition-all duration-200 cursor-pointer"
                style={{
                  transform: slice.isHovered ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: 'center',
                  filter: slice.isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none'
                }}
                onMouseEnter={() => onSliceHover(slice.id)}
                onMouseLeave={() => onSliceHover(null)}
              />
            ))}
          </svg>
          {data.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
              Veri yok
            </div>
          )}
        </div>
      </div>
    );
  };

  // Lejant komponenti
  const Legend = ({ data, title }: { data: PieSlice[]; title: string }) => (
    <div className="space-y-2">
      <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">{title}</h5>
      <div className="space-y-1">
        {data.map((slice) => (
          <div
            key={slice.id}
            className="flex items-center gap-2 text-xs cursor-pointer transition-colors"
            onMouseEnter={() => setHoveredSlice(slice.id)}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <div
              className="w-3 h-3 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-gray-700 dark:text-gray-300">{slice.label}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-auto">
              {slice.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // Bar Chart komponenti
  const BarChart = ({ data }: { data: BarData[] }) => {
    if (data.length === 0) {
      return (
        <div className="w-full">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
            Gelir Gider Karşılaştırması
          </h4>
          <div className="flex items-center justify-center h-48 text-gray-500">
            <div className="text-center">
              <p className="text-sm">Henüz aylık veri yok</p>
              <p className="text-xs text-gray-400">İşlem yaptığınızda grafik burada görünecek</p>
            </div>
          </div>
        </div>
      );
    }

    // Grafik boyutları
    const chartHeight = 300;
    const barWidth = 6; // İnce barlar
    
    // Y ekseni hesaplamaları - 10 parçalı
    const maxIncome = Math.max(...data.map(d => d.income));
    const maxExpense = Math.max(...data.map(d => d.expense));
    const maxValue = Math.max(maxIncome, maxExpense, 1);
    const yStep = maxValue / 10;
    
    // Bar pozisyonları hesaplama
    const getBarHeight = (value: number) => {
      return (value / maxValue) * chartHeight;
    };

    return (
      <div className="w-full">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
          Gelir Gider Karşılaştırması
        </h4>
        
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Yükleniyor...</p>
            </div>
          </div>
        ) : (
          <div className="relative w-full mt-6" style={{ height: chartHeight + 80 }}>
            {/* Y ekseni çizgileri ve etiketleri - 10 parçalı */}
            <div className="absolute left-0 top-0 bottom-0 w-20">
              {Array.from({ length: 11 }, (_, i) => {
                const value = i * yStep;
                const y = chartHeight - (i * chartHeight / 10);
                return (
                  <div key={i} className="absolute flex items-center" style={{ top: y }}>
                    <div className="w-16 h-px bg-gray-200"></div>
                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      {fmtMoney(value, 'TRY')}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Ana grafik alanı */}
            <div className="ml-20 relative" style={{ height: chartHeight }}>
              {/* Y ekseni çizgileri - 10 parçalı */}
              {Array.from({ length: 11 }, (_, i) => (
                <div
                  key={i}
                  className="absolute w-full h-px bg-gray-100"
                  style={{ top: i * chartHeight / 10 }}
                />
              ))}
              
              {/* Barlar */}
              <div className="relative h-full flex items-end justify-between px-4">
                {data.map((item, index) => {
                  // Negatif değerleri pozitife çevir
                  const income = Math.abs(item.income);
                  const expense = Math.abs(item.expense);
                  const incomeHeight = getBarHeight(income);
                  const expenseHeight = getBarHeight(expense);
                  const barSpacing = 100 / data.length;
                  
                  return (
                    <div key={index} className="flex flex-col items-center" style={{ width: `${barSpacing}%` }}>
                      {/* Gelir ve Gider barları yan yana - gelir solda, gider sağda */}
                      <div className="flex items-end gap-2 w-full justify-center">
                        {/* Gelir barı (solda) */}
                        {income > 0 && (
                          <div className="relative">
                            <div
                              className="bg-green-500 rounded-t transition-all duration-200 hover:bg-green-600"
                              style={{
                                width: barWidth,
                                height: Math.max(incomeHeight, 8), // Minimum 8px
                                minHeight: '8px'
                              }}
                              title={`Gelir: ${fmtMoney(income, 'TRY')}`}
                            />
                            {/* Değer etiketi - başlıktan uzak */}
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-green-600 font-medium whitespace-nowrap">
                              {fmtMoney(income, 'TRY')}
                            </div>
                          </div>
                        )}
                        
                        {/* Gider barı (sağda) */}
                        {expense > 0 && (
                          <div className="relative">
                            <div
                              className="bg-red-500 rounded-t transition-all duration-200 hover:bg-red-600"
                              style={{
                                width: barWidth,
                                height: Math.max(expenseHeight, 8), // Minimum 8px
                                minHeight: '8px'
                              }}
                              title={`Gider: ${fmtMoney(expense, 'TRY')}`}
                            />
                            {/* Değer etiketi - başlıktan uzak */}
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-medium whitespace-nowrap">
                              {fmtMoney(expense, 'TRY')}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Tarih etiketi */}
                      <div className="absolute -bottom-8 text-xs text-gray-600 dark:text-gray-400 text-center whitespace-nowrap">
                        {item.month}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* X ekseni */}
            <div className="ml-20 mt-4 h-px bg-gray-300"></div>
          </div>
        )}
        
        {/* Legend */}
        <div className="flex justify-center gap-2 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Gelir</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Gider</span>
          </div>
        </div>
      </div>
    );
  };

  const hasData = mainChartData.length > 0 || incomeChartData.length > 0 || expenseChartData.length > 0;

  return (
    <div className="reveal card overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Modern Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Finansal Analiz</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gelir ve gider dağılımları</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm">Veriler yükleniyor...</p>
          </div>
        </div>
      ) : !hasData ? (
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm">Henüz veri yok</p>
            <p className="text-xs text-gray-400">İşlem yaptığınızda grafikler burada görünecek</p>
          </div>
        </div>
      ) : (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Bar Chart - Sol Taraf */}
            <div className="xl:col-span-1">
              <BarChart data={monthlyData} />
            </div>

            {/* Pasta Grafikleri - Sağ Taraf */}
            <div className="xl:col-span-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gelir Kategorileri */}
                <div className="flex flex-col items-center">
                  <PieChart
                    data={incomeChartData}
                    title="Gelir Kategorileri"
                    size={300}
                    onSliceHover={setHoveredSlice}
                  />
                  <div className="mt-4 w-full max-w-xs">
                    <Legend data={incomeChartData} title="Gelir Kategorileri" />
                  </div>
                </div>

                {/* Gider Kategorileri */}
                <div className="flex flex-col items-center">
                  <PieChart
                    data={expenseChartData}
                    title="Gider Kategorileri"
                    size={300}
                    onSliceHover={setHoveredSlice}
                  />
                  <div className="mt-4 w-full max-w-xs">
                    <Legend data={expenseChartData} title="Gider Kategorileri" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}