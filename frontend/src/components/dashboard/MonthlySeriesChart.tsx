'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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

type YearlyData = {
  year: string;
  income: number;
  expense: number;
};

type ChartData = BarData | YearlyData;

type Tooltip = {
  x: number;
  y: number;
  label: string;
  percentage: number;
  value: number;
  color: string;
  type: 'pie' | 'bar';
  position: 'top' | 'bottom' | 'left' | 'right';
} | null;

type ViewMode = 'monthly' | 'yearly';

export default function MonthlySeriesChart({ incomeCategories, expenseCategories }: Props) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<BarData[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [filteredIncomeCategories, setFilteredIncomeCategories] = useState<CategoryTotal[]>([]);
  const [filteredExpenseCategories, setFilteredExpenseCategories] = useState<CategoryTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
  
  // Yıl seçimine göre viewMode'u otomatik ayarla
  useEffect(() => {
    if (selectedYear) {
      setViewMode('monthly');
    } else {
      setViewMode('yearly');
    }
  }, [selectedYear]);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animasyon ref'leri
  const barChartRef = useRef<HTMLDivElement>(null);
  const incomePieRef = useRef<HTMLDivElement>(null);
  const expensePieRef = useRef<HTMLDivElement>(null);

  // Yıl listesi oluştur (2020-2030 arası)
  const yearOptions = useMemo(() => {
    return Array.from({ length: 11 }, (_, i) => 2020 + i);
  }, []);

  // Aylık verileri al
  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoading(true);
        const series = await ReportsAPI.monthlySeries(24); // 2 yıllık veri al
        
        // Seçili yıla göre filtrele
        const filteredData = series
          .filter(item => {
            const itemYear = new Date(item.month + '-01').getFullYear();
            return selectedYear ? itemYear === selectedYear : true;
          })
          .map(item => ({
            month: new Date(item.month + '-01').toLocaleDateString('tr-TR', { 
              month: 'short'
            }),
            income: Math.abs(Number(item.income)), // Mutlak değer
            expense: Math.abs(Number(item.expense)) // Mutlak değer
          }));
        
        // Eksik ayları 0 ile doldur
        const allMonths = Array.from({ length: 12 }, (_, i) => {
          const date = new Date(selectedYear || new Date().getFullYear(), i, 1);
          return date.toLocaleDateString('tr-TR', { month: 'short' });
        });
        
        const completeData = allMonths.map(month => {
          const existing = filteredData.find(d => d.month === month);
          return existing || { month, income: 0, expense: 0 };
        });
        
        setMonthlyData(completeData);
      } catch (error) {
        console.error('Aylık veri alınamadı:', error);
        setMonthlyData([]);
      } finally {
        setLoading(false);
      }
    };

    if (viewMode === 'monthly') {
      fetchMonthlyData();
    }
  }, [selectedYear, viewMode]);

  // Yıllık verileri al
  useEffect(() => {
    const fetchYearlyData = async () => {
      try {
        setLoading(true);
        const series = await ReportsAPI.monthlySeries(72); // 6 yıllık veri al
        
        // Yıllık toplamları hesapla
        const yearlyTotals = new Map<number, { income: number; expense: number }>();
        
        series.forEach(item => {
          const year = new Date(item.month + '-01').getFullYear();
          const current = yearlyTotals.get(year) || { income: 0, expense: 0 };
          yearlyTotals.set(year, {
            income: current.income + Math.abs(Number(item.income)), // Mutlak değer
            expense: current.expense + Math.abs(Number(item.expense)) // Mutlak değer
          });
        });
        
        // Son 6 yılı al ve sırala (yıla göre artan)
        const sortedYears = Array.from(yearlyTotals.keys()).sort((a, b) => a - b).slice(-6);
        
        const data = sortedYears.map(year => ({
          year: year.toString(),
          income: yearlyTotals.get(year)?.income || 0,
          expense: yearlyTotals.get(year)?.expense || 0
        }));
        
        setYearlyData(data);
      } catch (error) {
        console.error('Yıllık veri alınamadı:', error);
        setYearlyData([]);
      } finally {
        setLoading(false);
      }
    };

    if (viewMode === 'yearly') {
      fetchYearlyData();
    }
  }, [viewMode]);

  // Kategori verilerini yıl seçimine göre güncelle
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setCategoryLoading(true);
        if (!selectedYear) {
          // Yıllık görünümde tüm kategoriler
          setFilteredIncomeCategories(incomeCategories);
          setFilteredExpenseCategories(expenseCategories);
        } else {
          // Aylık görünümde seçili yıla ait kategoriler
          const fromDate = `${selectedYear}-01-01`;
          const toDate = `${selectedYear}-12-31`;
          
          const [yearlyIncome, yearlyExpense] = await Promise.all([
            ReportsAPI.categoryTotals('INCOME', fromDate, toDate),
            ReportsAPI.categoryTotals('EXPENSE', fromDate, toDate)
          ]);
          
          setFilteredIncomeCategories(yearlyIncome);
          setFilteredExpenseCategories(yearlyExpense);
        }
      } catch (error) {
        console.error('Kategori verileri alınamadı:', error);
        // Hata durumunda props'tan gelen verileri kullan
        setFilteredIncomeCategories(incomeCategories);
        setFilteredExpenseCategories(expenseCategories);
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategoryData();
  }, [incomeCategories, expenseCategories, selectedYear]);

  // Grafik animasyonları
  useEffect(() => {
    if (loading || categoryLoading) return;

    // GSAP plugins'ini kaydet
    gsap.registerPlugin(ScrollTrigger);

    // Kısa bir gecikme ile animasyonları başlat
    const timer = setTimeout(() => {
      // Bar chart animasyonu - barların 0'dan yükselmesi
      if (barChartRef.current) {
        const bars = barChartRef.current.querySelectorAll('[data-bar]');
        
        if (bars.length > 0) {
          // Önce tüm barları 0 yüksekliğinde başlat
          gsap.set(bars, { height: 0, opacity: 0 });
          
          // Sonra animasyonla yükselt - tüm barlar aynı anda
          gsap.to(bars, 
            { 
              height: (i, target) => {
                const computedStyle = window.getComputedStyle(target);
                return computedStyle.height;
              },
              opacity: 1,
              duration: 1.2,
              ease: 'power2.out',
              stagger: 0, // Hiç stagger yok - hepsi aynı anda
              scrollTrigger: {
                trigger: barChartRef.current,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse',
              }
            }
          );
        }
      }

      // Pasta grafikleri animasyonu - çizgiden daireye dönüşüm
      const pieRefs = [incomePieRef, expensePieRef];
      pieRefs.forEach((ref, index) => {
        if (ref.current) {
          const paths = ref.current.querySelectorAll('path');
          if (paths.length > 0) {
            // Her path için animasyon
            paths.forEach((path, pathIndex) => {
              // Önce path'i görünmez yap
              gsap.set(path, { 
                opacity: 0,
                scale: 0,
                transformOrigin: 'center'
              });
              
              // Sonra animasyonla görünür yap - saat yönünde
              gsap.to(path,
                { 
                  opacity: 1,
                  scale: 1,
                  duration: 1.0,
                  delay: 0.3 + (index * 0.2) + (pathIndex * 0.1),
                  ease: 'power2.out',
                  scrollTrigger: {
                    trigger: ref.current,
                    start: 'top 80%',
                    end: 'bottom 20%',
                    toggleActions: 'play none none reverse',
                  }
                }
              );
            });
          }
        }
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [loading, categoryLoading]);

  // Ana pasta grafiği için veri hesaplama
  const mainChartData = useMemo(() => {
    const totalIncome = filteredIncomeCategories.reduce((sum, cat) => sum + Number(cat.total), 0);
    const totalExpense = filteredExpenseCategories.reduce((sum, cat) => sum + Number(cat.total), 0);
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
  }, [filteredIncomeCategories, filteredExpenseCategories, hoveredSlice]);

  // Gelir kategorileri pasta grafiği
  const incomeChartData = useMemo(() => {
    const total = filteredIncomeCategories.reduce((sum, cat) => sum + Number(cat.total), 0);
    
    // Eğer toplam 0 ise, "Veri Bulunmuyor" dilimi göster
    if (total === 0) {
      return [{
        id: 'no-data',
        label: 'Veri Bulunmuyor',
        value: 0,
        percentage: 100,
        startAngle: 0,
        endAngle: 360,
        color: '#F3F4F6',
        isHovered: hoveredSlice === 'no-data'
      }];
    }
    
    const slices: PieSlice[] = [];
    let currentAngle = 0;

    filteredIncomeCategories.forEach((cat, index) => {
      const percentage = (Number(cat.total) / total) * 100;
      const angle = (percentage / 100) * 360;
      // Kategorinin kendi rengini kullan, yoksa fallback renk
      const color = cat.color || `hsl(${120 + index * 30}, 70%, 50%)`;
      
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
  }, [filteredIncomeCategories, hoveredSlice]);

  // Gider kategorileri pasta grafiği
  const expenseChartData = useMemo(() => {
    const total = filteredExpenseCategories.reduce((sum, cat) => sum + Number(cat.total), 0);
    
    // Eğer toplam 0 ise, "Veri Bulunmuyor" dilimi göster
    if (total === 0) {
      return [{
        id: 'no-data',
        label: 'Veri Bulunmuyor',
        value: 0,
        percentage: 100,
        startAngle: 0,
        endAngle: 360,
        color: '#F3F4F6',
        isHovered: hoveredSlice === 'no-data'
      }];
    }
    
    const slices: PieSlice[] = [];
    let currentAngle = 0;

    filteredExpenseCategories.forEach((cat, index) => {
      const percentage = (Number(cat.total) / total) * 100;
      const angle = (percentage / 100) * 360;
      // Kategorinin kendi rengini kullan, yoksa fallback renk
      const color = cat.color || `hsl(${0 + index * 30}, 70%, 50%)`;
      
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
  }, [filteredExpenseCategories, hoveredSlice]);

  // Pasta dilimi çizimi
  const createPieSlice = (slice: PieSlice, radius: number, centerX: number, centerY: number) => {
    // Tek dilim için özel durum (tam daire)
    if (slice.endAngle - slice.startAngle >= 360) {
      const path = [
        `M ${centerX} ${centerY}`,
        `m -${radius} 0`,
        `a ${radius} ${radius} 0 1 1 ${radius * 2} 0`,
        `a ${radius} ${radius} 0 1 1 -${radius * 2} 0`,
        'Z'
      ].join(' ');
      return path;
    }
    
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

    // Mouse enter handler
    const handleMouseEnter = (slice: PieSlice, event: React.MouseEvent<SVGPathElement>) => {
      onSliceHover(slice.id);
      
      // Önceki timeout'u temizle
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      
      // Tooltip pozisyonunu hesapla
      const rect = event.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Pasta grafiği için en uygun pozisyonu belirle
      const position = centerY < window.innerHeight / 2 ? 'bottom' : 'top';
      
      setTooltip({
        x: centerX,
        y: position === 'top' ? centerY - 20 : centerY + 20,
        label: slice.label,
        percentage: slice.percentage,
        value: slice.value,
        color: slice.color,
        type: 'pie',
        position
      });
    };

    // Mouse leave handler
    const handleMouseLeave = () => {
      onSliceHover(null);
      // Tooltip'i hemen gizleme, kısa bir gecikme ile gizle
      tooltipTimeoutRef.current = setTimeout(() => {
        setTooltip(null);
      }, 100);
    };

    return (
      <div className="flex flex-col items-center">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{title}</h4>
        <div className="relative">
          <svg 
            width={size} 
            height={size} 
            className="transform transition-transform duration-200"
            onMouseLeave={handleMouseLeave}
            role="img"
            aria-label={`${title} pasta grafiği`}
          >
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
                onMouseEnter={(e) => handleMouseEnter(slice, e)}
                onMouseLeave={handleMouseLeave}
              />
            ))}
          </svg>
          
          {data.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
              Veri yok
            </div>
          )}
          
          {/* Veri Bulunmuyor durumu için özel görünüm - sadece gerçekten veri yoksa göster */}
          {data.length === 1 && data[0].id === 'no-data' && data[0].value === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Veri Bulunmuyor</span>
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
            {slice.id !== 'no-data' && (
              <span className="text-gray-500 dark:text-gray-400 ml-auto">
                {slice.percentage.toFixed(1)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Bar Chart komponenti
  const BarChart = ({ data }: { data: ChartData[] }) => {
    if (data.length === 0) {
      return (
        <div className="w-full">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
            Gelir Gider Karşılaştırması
          </h4>
          <div className="flex items-center justify-center h-48 text-gray-500">
            <div className="text-center">
              <p className="text-sm">Henüz {viewMode === 'monthly' ? 'aylık' : 'yıllık'} veri yok</p>
              <p className="text-xs text-gray-400">İşlem yaptığınızda grafik burada görünecek</p>
            </div>
          </div>
        </div>
      );
    }

    // Grafik boyutları
    const chartHeight = 300;
    const barWidth = 12; // Daha geniş ve modern barlar
    
    // Y ekseni hesaplamaları - Dinamik nice number
    const maxIncome = Math.max(...data.map(d => Math.abs(d.income)));
    const maxExpense = Math.max(...data.map(d => Math.abs(d.expense)));
    const maxValue = Math.max(maxIncome, maxExpense, 1);
    
    // Gelişmiş nice number hesaplama - bar'ın üst sınırın altında kalması için
    const niceNumber = (max: number) => {
      const exponent = Math.floor(Math.log10(max));
      const fraction = max / Math.pow(10, exponent);
      let niceFraction;
      
      // Daha hassas nice number seçimi
      if (fraction <= 1) niceFraction = 1;
      else if (fraction <= 1.5) niceFraction = 1.5;
      else if (fraction <= 2) niceFraction = 2;
      else if (fraction <= 2.5) niceFraction = 2.5;
      else if (fraction <= 3) niceFraction = 3;
      else if (fraction <= 4) niceFraction = 4;
      else if (fraction <= 5) niceFraction = 5;
      else if (fraction <= 6) niceFraction = 6;
      else if (fraction <= 7) niceFraction = 7;
      else if (fraction <= 8) niceFraction = 8;
      else if (fraction <= 9) niceFraction = 9;
      else niceFraction = 10;
      
      return niceFraction * Math.pow(10, exponent);
    };
    
    // Maksimum değeri nice number'a yuvarla ve %10 buffer ekle
    const niceMax = niceNumber(maxValue * 1.1);
    const yStep = niceMax / 5;
    
    // Bar pozisyonları hesaplama - dinamik yükseklik
    const getBarHeight = (value: number) => {
      const height = (Math.abs(value) / niceMax) * chartHeight;
      // Minimum 8px yükseklik garantisi
      return Math.max(height, 8);
    };

    // Bar hover handler
    const handleBarHover = (event: React.MouseEvent, item: ChartData, type: 'income' | 'expense') => {
      const rect = event.currentTarget.getBoundingClientRect();
      const value = type === 'income' ? item.income : item.expense;
      const color = type === 'income' ? '#22C55E' : '#EF4444';
      const label = type === 'income' ? 'Gelir' : 'Gider';
      
      // Type guard ile month/year kontrolü
      const period = 'month' in item ? item.month : item.year;
      
      // Bar için en uygun pozisyonu belirle
      const position = rect.top < window.innerHeight / 2 ? 'bottom' : 'top';
      
      setTooltip({
        x: rect.left + rect.width / 2,
        y: position === 'top' ? rect.top - 15 : rect.bottom + 15,
        label: `${label} - ${period}`,
        percentage: 0, // Bar chart için percentage kullanmıyoruz
        value: Math.abs(value),
        color,
        type: 'bar',
        position
      });
    };

    const handleBarLeave = () => {
      // Tooltip'i hemen gizleme, kısa bir gecikme ile gizle
      tooltipTimeoutRef.current = setTimeout(() => {
        setTooltip(null);
      }, 100);
    };

    return (
      <div className="w-full" ref={barChartRef}>
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
            {/* Y ekseni çizgileri ve etiketleri - Dinamik */}
            <div className="absolute left-0 top-0 bottom-0 w-16">
              {Array.from({ length: 6 }, (_, i) => {
                const value = i * yStep;
                const y = chartHeight - (i * chartHeight / 5);
                return (
                  <div key={i} className="absolute flex items-center" style={{ top: y }}>
                    <div className="w-8 h-px bg-gray-300"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-1 whitespace-nowrap font-medium">
                      {fmtMoney(value, 'TRY')}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Ana grafik alanı */}
            <div className="ml-16 relative" style={{ height: chartHeight }}>
              {/* Y ekseni çizgileri - Dinamik */}
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="absolute w-full h-px bg-gray-200/50"
                  style={{ top: i * chartHeight / 5 }}
                />
              ))}
              
              {/* Barlar */}
              <div className="relative h-full flex items-end justify-between px-6">
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
                              data-bar="income"
                              className="bg-gradient-to-t from-green-600 to-green-500 rounded-t-sm shadow-sm transition-all duration-200 hover:from-green-700 hover:to-green-600 hover:shadow-md cursor-pointer"
                              style={{
                                width: barWidth,
                                height: incomeHeight,
                                minHeight: '8px'
                              }}
                              onMouseEnter={(e) => handleBarHover(e, item, 'income')}
                              onMouseLeave={handleBarLeave}
                            />
                          </div>
                        )}
                        
                        {/* Gider barı (sağda) */}
                        {expense > 0 && (
                          <div className="relative">
                            <div
                              data-bar="expense"
                              className="bg-gradient-to-t from-red-600 to-red-500 rounded-t-sm shadow-sm transition-all duration-200 hover:from-red-700 hover:to-red-600 hover:shadow-md cursor-pointer"
                              style={{
                                width: barWidth,
                                height: expenseHeight,
                                minHeight: '8px'
                              }}
                              onMouseEnter={(e) => handleBarHover(e, item, 'expense')}
                              onMouseLeave={handleBarLeave}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Tarih etiketi */}
                      <div className="absolute -bottom-12 translate-y-2 text-xs text-gray-600 dark:text-gray-400 text-center whitespace-nowrap transform -rotate-45 origin-top-left px-1">
                        {'month' in item ? item.month : item.year}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* X ekseni */}
            <div className="ml-16 mt-2 h-0.5 bg-gray-400"></div>
          </div>
        )}
        
        {/* Legend */}
        <div className="flex justify-center gap-2 mt-2">
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
    <div className="reveal">
      {/* Modern Header */}
      <div className="p-6 pb-4 bg-gradient-to-r from-gray-50/80 to-blue-50/80 dark:from-gray-800/80 dark:to-gray-700/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Finansal Analiz
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gelir ve gider dağılımları</p>
          </div>
          
          {/* Filtreler */}
          <div className="flex items-center gap-4">
            {/* Yıl Seçimi */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Yıl:</label>
              <div className="relative">
                <select
                  value={selectedYear || ''}
                  onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
                  className="appearance-none text-sm border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 pr-8 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 shadow-sm"
                >
                  <option value="">Tüm Yıllar</option>
                  {yearOptions.map((year: number) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Görünüm Toggle */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Görünüm:</label>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('monthly')}
                  disabled={!selectedYear}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium ${
                    viewMode === 'monthly' && selectedYear
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : selectedYear
                      ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                      : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  aria-pressed={viewMode === 'monthly'}
                >
                  Aylık
                </button>
                <button
                  onClick={() => setViewMode('yearly')}
                  disabled={selectedYear !== null}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium ${
                    viewMode === 'yearly' && selectedYear === null
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : selectedYear === null
                      ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                      : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  aria-pressed={viewMode === 'yearly'}
                >
                  Yıllık
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl px-3 py-2 text-sm pointer-events-none backdrop-blur-sm"
          style={{
            left: Math.min(Math.max(tooltip.x - 100, 10), window.innerWidth - 220), // Sağ/sol kenara taşmasını önle
            top: tooltip.position === 'top' 
              ? Math.max(tooltip.y - 60, 10) 
              : Math.min(tooltip.y + 10, window.innerHeight - 80), // Üst/alt kenara taşmasını önle
            transform: tooltip.position === 'top' ? 'translateY(-100%)' : 'translateY(0)',
            maxWidth: '200px'
          }}
        >
          {/* Tooltip ok işareti */}
          <div 
            className={`absolute w-2 h-2 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 transform rotate-45 ${
              tooltip.position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : 'top-[-4px] left-1/2 -translate-x-1/2'
            }`}
          />
          
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full shadow-sm" 
              style={{ backgroundColor: tooltip.color }}
            />
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {tooltip.label}
            </span>
          </div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">
            {tooltip.percentage > 0 ? `${tooltip.percentage.toFixed(1)}% • ` : ''}{fmtMoney(tooltip.value, 'TRY')}
          </div>
        </div>
      )}

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
              <BarChart data={viewMode === 'monthly' ? monthlyData : yearlyData} />
            </div>

            {/* Pasta Grafikleri - Sağ Taraf */}
            <div className="xl:col-span-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gelir Kategorileri */}
                <div className="flex flex-col items-center">
                  {categoryLoading ? (
                    <div className="flex flex-col items-center">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Gelir Kategorileri</h4>
                      <div className="w-[300px] h-[300px] flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-8 h-8 mx-auto mb-2 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                          <p className="text-sm text-gray-500">Yükleniyor...</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div ref={incomePieRef}>
                        <PieChart
                          data={incomeChartData}
                          title="Gelir Kategorileri"
                          size={300}
                          onSliceHover={setHoveredSlice}
                        />
                      </div>
                      <div className="mt-4 w-full max-w-xs">
                        <Legend data={incomeChartData} title="Gelir Kategorileri" />
                      </div>
                    </>
                  )}
                </div>

                {/* Gider Kategorileri */}
                <div className="flex flex-col items-center">
                  {categoryLoading ? (
                    <div className="flex flex-col items-center">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Gider Kategorileri</h4>
                      <div className="w-[300px] h-[300px] flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-8 h-8 mx-auto mb-2 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                          <p className="text-sm text-gray-500">Yükleniyor...</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div ref={expensePieRef}>
                        <PieChart
                          data={expenseChartData}
                          title="Gider Kategorileri"
                          size={300}
                          onSliceHover={setHoveredSlice}
                        />
                      </div>
                      <div className="mt-4 w-full max-w-xs">
                        <Legend data={expenseChartData} title="Gider Kategorileri" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}