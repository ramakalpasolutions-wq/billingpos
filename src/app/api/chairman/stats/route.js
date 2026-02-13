import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'CHAIRMAN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all branches for the organization (removed isActive filter)
    const branches = await prisma.branch.findMany({
      where: {
        restaurantId: session.user.restaurantId
      }
    });

    const branchIds = branches.map(b => b.id);

    // If no branches, return empty stats
    if (branchIds.length === 0) {
      return NextResponse.json({
        stats: {
          revenue: { total: 0, today: 0, month: 0, year: 0 },
          orders: { total: 0, today: 0, active: 0 },
          overview: { totalCustomers: 0, totalStaff: 0, totalBranches: 0 },
          topItems: [],
          branchPerformance: [],
          revenueTrend: [],
          paymentMethods: []
        }
      }, { status: 200 });
    }

    // Get date range (today, this month, this year)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // === CALCULATE REVENUE FROM ORDERS (Not Payments) ===
    
    // Total Revenue (All time) - From completed orders
    let totalRevenue = 0;
    try {
      const completedOrders = await prisma.order.findMany({
        where: {
          branchId: { in: branchIds },
          status: 'COMPLETED'
        },
        select: {
          grandTotal: true
        }
      });
      totalRevenue = completedOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    } catch (e) {
      console.log('Error calculating total revenue:', e.message);
    }

    // Today's Revenue
    let todayRevenue = 0;
    try {
      const todayOrders = await prisma.order.findMany({
        where: {
          branchId: { in: branchIds },
          status: 'COMPLETED',
          createdAt: {
            gte: today
          }
        },
        select: {
          grandTotal: true
        }
      });
      todayRevenue = todayOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    } catch (e) {
      console.log('Error calculating today revenue:', e.message);
    }

    // This Month's Revenue
    let monthRevenue = 0;
    try {
      const monthOrders = await prisma.order.findMany({
        where: {
          branchId: { in: branchIds },
          status: 'COMPLETED',
          createdAt: {
            gte: startOfMonth
          }
        },
        select: {
          grandTotal: true
        }
      });
      monthRevenue = monthOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    } catch (e) {
      console.log('Error calculating month revenue:', e.message);
    }

    // This Year's Revenue
    let yearRevenue = 0;
    try {
      const yearOrders = await prisma.order.findMany({
        where: {
          branchId: { in: branchIds },
          status: 'COMPLETED',
          createdAt: {
            gte: startOfYear
          }
        },
        select: {
          grandTotal: true
        }
      });
      yearRevenue = yearOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    } catch (e) {
      console.log('Error calculating year revenue:', e.message);
    }

    // Total Orders
    const totalOrders = await prisma.order.count({
      where: {
        branchId: { in: branchIds }
      }
    });

    // Today's Orders
    const todayOrders = await prisma.order.count({
      where: {
        branchId: { in: branchIds },
        createdAt: {
          gte: today
        }
      }
    });

    // Active Orders (in kitchen or pending)
    const activeOrders = await prisma.order.count({
      where: {
        branchId: { in: branchIds },
        status: {
          in: ['PENDING', 'KOT_SENT', 'PREPARING', 'READY']
        }
      }
    });

    // Total Customers (unique)
    const totalCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER'
      }
    });

    // Total Staff
    const totalStaff = await prisma.user.count({
      where: {
        branchId: { in: branchIds },
        role: { in: ['WAITER', 'CASHIER', 'KITCHEN', 'MANAGER'] }
      }
    });

    // Total Branches
    const totalBranches = branches.length;

    // Top Selling Items (This month)
    let topItemsWithDetails = [];
    try {
      const topItems = await prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: {
          order: {
            branchId: { in: branchIds },
            createdAt: {
              gte: startOfMonth
            }
          }
        },
        _sum: {
          quantity: true,
          totalPrice: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      });

      // Get menu item details for top items
      topItemsWithDetails = await Promise.all(
        topItems.map(async (item) => {
          const menuItem = await prisma.menuItem.findUnique({
            where: { id: item.menuItemId }
          });
          return {
            name: menuItem?.name || 'Unknown',
            quantity: item._sum.quantity || 0,
            revenue: item._sum.totalPrice || 0
          };
        })
      );
    } catch (e) {
      console.log('Error fetching top items:', e.message);
    }

    // Branch Performance
    const branchPerformance = await Promise.all(
      branches.map(async (branch) => {
        let branchRevenue = 0;
        try {
          const branchOrders = await prisma.order.findMany({
            where: {
              branchId: branch.id,
              status: 'COMPLETED',
              createdAt: {
                gte: startOfMonth
              }
            },
            select: {
              grandTotal: true
            }
          });
          branchRevenue = branchOrders.reduce((sum, order) => sum + order.grandTotal, 0);
        } catch (e) {
          console.log(`Error calculating revenue for branch ${branch.name}:`, e.message);
        }

        const branchOrderCount = await prisma.order.count({
          where: {
            branchId: branch.id,
            createdAt: {
              gte: startOfMonth
            }
          }
        });

        return {
          name: branch.name,
          revenue: branchRevenue,
          orders: branchOrderCount
        };
      })
    );

    // Revenue trend (last 7 days)
    const revenueTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      let dayRevenue = 0;
      try {
        const dayOrders = await prisma.order.findMany({
          where: {
            branchId: { in: branchIds },
            status: 'COMPLETED',
            createdAt: {
              gte: date,
              lt: nextDate
            }
          },
          select: {
            grandTotal: true
          }
        });
        dayRevenue = dayOrders.reduce((sum, order) => sum + order.grandTotal, 0);
      } catch (e) {
        console.log(`Error calculating revenue for ${date}:`, e.message);
      }

      revenueTrend.push({
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue: dayRevenue
      });
    }

    // Payment method breakdown (This month) - From Payment table
    let paymentMethods = [];
    try {
      const payments = await prisma.payment.findMany({
        where: {
          order: {
            branchId: { in: branchIds }
          },
          status: 'COMPLETED',
          createdAt: {
            gte: startOfMonth
          }
        },
        select: {
          paymentMode: true,
          amountPaid: true
        }
      });

      // Group by payment mode manually
      const paymentMap = {};
      payments.forEach(payment => {
        if (!paymentMap[payment.paymentMode]) {
          paymentMap[payment.paymentMode] = {
            amount: 0,
            count: 0
          };
        }
        paymentMap[payment.paymentMode].amount += payment.amountPaid;
        paymentMap[payment.paymentMode].count += 1;
      });

      paymentMethods = Object.keys(paymentMap).map(mode => ({
        method: mode,
        amount: paymentMap[mode].amount,
        count: paymentMap[mode].count
      }));
    } catch (e) {
      console.log('Error fetching payment methods:', e.message);
    }

    const stats = {
      revenue: {
        total: totalRevenue,
        today: todayRevenue,
        month: monthRevenue,
        year: yearRevenue
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        active: activeOrders
      },
      overview: {
        totalCustomers,
        totalStaff,
        totalBranches
      },
      topItems: topItemsWithDetails,
      branchPerformance: branchPerformance,
      revenueTrend: revenueTrend,
      paymentMethods: paymentMethods
    };

    console.log('Stats calculated:', {
      totalRevenue,
      todayRevenue,
      monthRevenue,
      yearRevenue,
      totalOrders,
      todayOrders
    });

    return NextResponse.json({ stats }, { status: 200 });

  } catch (error) {
    console.error('Chairman stats error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to fetch statistics', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
