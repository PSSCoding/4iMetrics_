// Demo Reporting Dashboard UI with static KPI data for three dummy apps.
// Built with React + Recharts via CDN, designed to run on GitHub Pages without any build step.

(function () {
  const e = React.createElement;
  const { useState, useMemo } = React;
  const {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
  } = Recharts;

  const APPS = [
    {
      id: "alpha",
      name: "App Alpha",
      dailyMetrics: generateDailyMetrics(
        "2025-11-01",
        14,
        {
          baseCreated: 120,
          baseUpdated: 80,
          baseDeleted: 10,
          baseViewed: 320,
          baseUsers: 50,
          baseRecords: 4000,
          volume: 1.8,
          depth: 2.3,
          growthFactor: 1.05,
        }
      ),
      systemStatus: generateSystemStatus("2025-11-01", 14, [3, 10]),
    },
    {
      id: "beta",
      name: "App Beta",
      dailyMetrics: generateDailyMetrics(
        "2025-11-01",
        14,
        {
          baseCreated: 180,
          baseUpdated: 140,
          baseDeleted: 25,
          baseViewed: 500,
          baseUsers: 95,
          baseRecords: 6200,
          volume: 2.6,
          depth: 3.2,
          growthFactor: 1.12,
        }
      ),
      systemStatus: generateSystemStatus("2025-11-01", 14, [5, 9, 12]),
    },
    {
      id: "gamma",
      name: "App Gamma",
      dailyMetrics: generateDailyMetrics(
        "2025-11-01",
        14,
        {
          baseCreated: 90,
          baseUpdated: 60,
          baseDeleted: 8,
          baseViewed: 260,
          baseUsers: 45,
          baseRecords: 3500,
          volume: 1.4,
          depth: 1.9,
          growthFactor: 1.02,
        }
      ),
      systemStatus: generateSystemStatus("2025-11-01", 14, [2, 6, 13]),
    },
  ];

  function generateDailyMetrics(startDateStr, days, config) {
    const baseDate = new Date(startDateStr + "T00:00:00Z");
    const results = [];
    let runningRecords = config.baseRecords;
    for (let i = 0; i < days; i++) {
      const date = new Date(baseDate.getTime());
      date.setUTCDate(date.getUTCDate() + i);
      const factor = Math.pow(config.growthFactor, i);
      const created = Math.round(config.baseCreated * factor + (i % 3) * 7);
      const updated = Math.round(config.baseUpdated * factor + (i % 4) * 5);
      const deleted = Math.round(config.baseDeleted * (1 + (i % 2) * 0.2));
      const viewed = Math.round(config.baseViewed * (0.9 + (i % 5) * 0.03));
      const totalUsers = Math.round(config.baseUsers * (1 + i * 0.02));
      const dailyActiveUsers = Math.max(
        0,
        Math.round(totalUsers * (0.55 + (i % 4) * 0.03))
      );
      const medianChangeVolume = parseFloat(
        (config.volume * (1 + (i % 4) * 0.04)).toFixed(2)
      );
      const medianChangeDepth = parseFloat(
        (config.depth * (1 + (i % 5) * 0.05)).toFixed(2)
      );
      const netGrowth = created - deleted;
      runningRecords += netGrowth;
      const eventsPerUser = dailyActiveUsers
        ? parseFloat(
            (
              (created + updated + deleted + viewed) /
              dailyActiveUsers
            ).toFixed(2)
          )
        : 0;

      results.push({
        date: date.toISOString().slice(0, 10),
        created,
        updated,
        deleted,
        viewed,
        totalUsers,
        dailyActiveUsers,
        totalRecords: runningRecords,
        medianChangeVolume,
        medianChangeDepth,
        netGrowth,
        eventsPerUser,
      });
    }
    addRollingAverages(results, "dailyActiveUsers", 7);
    addRollingAverages(results, "medianChangeVolume", 7);
    addRollingAverages(results, "medianChangeDepth", 7);
    return results;
  }

  function generateSystemStatus(startDateStr, days, failureIndices) {
    const baseDate = new Date(startDateStr + "T00:00:00Z");
    const imports = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(baseDate.getTime());
      date.setUTCDate(date.getUTCDate() + i);
      imports.push({
        date: date.toISOString().slice(0, 10),
        success: failureIndices.indexOf(i) === -1,
      });
    }
    const lastSuccessfulIndex = [...imports]
      .reverse()
      .find((item) => item.success);
    return {
      lastSuccessfulImport: lastSuccessfulIndex
        ? new Date(lastSuccessfulIndex.date + "T02:00:00Z").toISOString()
        : null,
      imports,
    };
  }

  function addRollingAverages(data, fieldName, windowSize) {
    const values = [];
    for (let i = 0; i < data.length; i++) {
      values.push(data[i][fieldName]);
      const windowStart = Math.max(0, i - windowSize + 1);
      const slice = values.slice(windowStart, i + 1);
      const avg =
        slice.reduce((sum, v) => sum + (typeof v === "number" ? v : 0), 0) /
        slice.length;
      data[i][fieldName + "Rolling"] = parseFloat(avg.toFixed(2));
    }
  }

  function computeReportSuccessRate(systemStatus) {
    const totalCount = systemStatus.imports.length;
    const successCount = systemStatus.imports.filter((i) => i.success).length;
    const percentage = totalCount
      ? parseFloat(((successCount / totalCount) * 100).toFixed(1))
      : 0;
    return { percentage, successCount, totalCount };
  }

  function formatNumber(value) {
    if (value === undefined || value === null || isNaN(value)) return "-";
    return value.toLocaleString();
  }

  function formatDecimal(value) {
    if (value === undefined || value === null || isNaN(value)) return "-";
    return parseFloat(value).toFixed(2);
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    return (
      date.getUTCDate().toString().padStart(2, "0") +
      "." +
      (date.getUTCMonth() + 1).toString().padStart(2, "0") +
      "." +
      date.getUTCFullYear() +
      " " +
      date.getUTCHours().toString().padStart(2, "0") +
      ":" +
      date.getUTCMinutes().toString().padStart(2, "0")
    );
  }

  function Section(props) {
    return e(
      "section",
      { className: "section" },
      e("h2", { className: "section-title" }, props.title),
      props.children
    );
  }

  function KpiCard(props) {
    return e(
      "div",
      { className: "kpi-card" },
      e("div", { className: "kpi-title" }, props.title),
      e("div", { className: "kpi-value" }, props.value),
      props.subtitle
        ? e("div", { className: "kpi-subtitle" }, props.subtitle)
        : null
    );
  }

  function Sidebar(props) {
    return e(
      "div",
      { className: "sidebar" },
      e("div", { className: "sidebar-header" }, "Reporting Apps"),
      e(
        "div",
        { className: "sidebar-list" },
        props.apps.map(function (app) {
          const active = app.id === props.selectedAppId;
          const className = active ? "sidebar-item active" : "sidebar-item";
          return e(
            "div",
            {
              key: app.id,
              className: className,
              onClick: function () {
                props.onSelectApp(app.id);
              },
            },
            app.name
          );
        })
      )
    );
  }

  function ChartContainer(props) {
    return e(
      "div",
      { className: "chart-card" },
      e("div", { className: "chart-title" }, props.title),
      props.children
    );
  }

  function SystemStatusSection(props) {
    const rate = useMemo(
      function () {
        return computeReportSuccessRate(props.systemStatus);
      },
      [props.systemStatus]
    );

    return e(
      Section,
      { title: "System Status" },
      e(
        "div",
        { className: "kpi-grid" },
        e(KpiCard, {
          title: "Last Successful Import",
          value: formatDate(props.systemStatus.lastSuccessfulImport),
        }),
        e(KpiCard, {
          title: "Report Success Rate",
          value: rate.percentage + "%",
          subtitle:
            rate.successCount + " / " + rate.totalCount + " successful imports",
        })
      ),
      e(
        ChartContainer,
        { title: "Import Success by Day" },
        e(
          ResponsiveContainer,
          { width: "100%", height: 220 },
          e(
            BarChart,
            { data: props.systemStatus.imports },
            e(CartesianGrid, { strokeDasharray: "3 3" }),
            e(XAxis, { dataKey: "date" }),
            e(YAxis, { domain: [0, 1], ticks: [0, 1] }),
            e(Tooltip, null),
            e(Legend, null),
            e(Bar, {
              dataKey: function (d) {
                return d.success ? 1 : 0;
              },
              name: "Success",
              fill: "#f97316",
            })
          )
        )
      )
    );
  }

  function EntryRelatedSection(props) {
    const latest = props.dailyMetrics[props.dailyMetrics.length - 1] || {};
    return e(
      Section,
      { title: "Entry Related" },
      e(
        "div",
        { className: "kpi-grid" },
        e(KpiCard, { title: "Created Entries", value: formatNumber(latest.created) }),
        e(KpiCard, { title: "Updated Entries", value: formatNumber(latest.updated) }),
        e(KpiCard, { title: "Deleted Entries", value: formatNumber(latest.deleted) }),
        e(KpiCard, {
          title: "Read / Viewed Entries",
          value: formatNumber(latest.viewed),
          subtitle: "optional",
        })
      ),
      e(
        ChartContainer,
        { title: "Daily CRUD Volume" },
        e(
          ResponsiveContainer,
          { width: "100%", height: 250 },
          e(
            LineChart,
            { data: props.dailyMetrics },
            e(CartesianGrid, { strokeDasharray: "3 3" }),
            e(XAxis, { dataKey: "date" }),
            e(YAxis, null),
            e(Tooltip, null),
            e(Legend, null),
            e(Line, { type: "monotone", dataKey: "created", stroke: "#f97316", name: "Created" }),
            e(Line, { type: "monotone", dataKey: "updated", stroke: "#0ea5e9", name: "Updated" }),
            e(Line, { type: "monotone", dataKey: "deleted", stroke: "#ef4444", name: "Deleted" }),
            e(Line, { type: "monotone", dataKey: "viewed", stroke: "#6366f1", name: "Viewed", strokeDasharray: "4 4" })
          )
        )
      ),
      e(
        ChartContainer,
        { title: "Latest Day CRUD Mix" },
        e(
          ResponsiveContainer,
          { width: "100%", height: 250 },
          e(
            PieChart,
            null,
            e(
              Pie,
              {
                data: [
                  { name: "Created", value: latest.created || 0 },
                  { name: "Updated", value: latest.updated || 0 },
                  { name: "Deleted", value: latest.deleted || 0 },
                ],
                cx: "50%",
                cy: "50%",
                outerRadius: 80,
                label: true,
                dataKey: "value",
              },
              e(Cell, { fill: "#f97316" }),
              e(Cell, { fill: "#0ea5e9" }),
              e(Cell, { fill: "#ef4444" })
            ),
            e(Tooltip, null),
            e(Legend, null)
          )
        )
      )
    );
  }

  function UserRelatedSection(props) {
    const latest = props.dailyMetrics[props.dailyMetrics.length - 1] || {};
    return e(
      Section,
      { title: "User Related" },
      e(
        "div",
        { className: "kpi-grid" },
        e(KpiCard, { title: "Total Users", value: formatNumber(latest.totalUsers) }),
        e(KpiCard, {
          title: "Daily Active Users",
          value: formatNumber(latest.dailyActiveUsers),
          subtitle: "7d avg: " + formatNumber(latest.dailyActiveUsersRolling),
        }),
        e(KpiCard, {
          title: "Events per User",
          value: formatDecimal(latest.eventsPerUser),
          subtitle: "(Created + Updated + Deleted + Viewed) / DAU",
        })
      ),
      e(
        ChartContainer,
        { title: "Daily Active Users" },
        e(
          ResponsiveContainer,
          { width: "100%", height: 240 },
          e(
            LineChart,
            { data: props.dailyMetrics },
            e(CartesianGrid, { strokeDasharray: "3 3" }),
            e(XAxis, { dataKey: "date" }),
            e(YAxis, null),
            e(Tooltip, null),
            e(Legend, null),
            e(Line, { type: "monotone", dataKey: "dailyActiveUsers", stroke: "#0ea5e9", name: "DAU" }),
            e(Line, { type: "monotone", dataKey: "dailyActiveUsersRolling", stroke: "#6366f1", name: "DAU 7d Avg", strokeDasharray: "4 4" })
          )
        )
      ),
      e(
        ChartContainer,
        { title: "Events per User" },
        e(
          ResponsiveContainer,
          { width: "100%", height: 220 },
          e(
            LineChart,
            { data: props.dailyMetrics },
            e(CartesianGrid, { strokeDasharray: "3 3" }),
            e(XAxis, { dataKey: "date" }),
            e(YAxis, null),
            e(Tooltip, null),
            e(Legend, null),
            e(Line, { type: "monotone", dataKey: "eventsPerUser", stroke: "#f97316", name: "Events/User" })
          )
        )
      )
    );
  }

  function DataSetsSection(props) {
    const latest = props.dailyMetrics[props.dailyMetrics.length - 1] || {};
    return e(
      Section,
      { title: "Data Sets" },
      e(
        "div",
        { className: "kpi-grid" },
        e(KpiCard, { title: "Total Records", value: formatNumber(latest.totalRecords) }),
        e(KpiCard, {
          title: "Net Dataset Growth",
          value: formatNumber(latest.netGrowth),
          subtitle: "Created − Deleted (latest day)",
        })
      ),
      e(
        ChartContainer,
        { title: "Total Records Over Time" },
        e(
          ResponsiveContainer,
          { width: "100%", height: 240 },
          e(
            AreaChart,
            { data: props.dailyMetrics },
            e(CartesianGrid, { strokeDasharray: "3 3" }),
            e(XAxis, { dataKey: "date" }),
            e(YAxis, null),
            e(Tooltip, null),
            e(Area, { type: "monotone", dataKey: "totalRecords", stroke: "#0ea5e9", fill: "#bae6fd" })
          )
        )
      ),
      e(
        ChartContainer,
        { title: "Net Growth per Day" },
        e(
          ResponsiveContainer,
          { width: "100%", height: 220 },
          e(
            BarChart,
            { data: props.dailyMetrics },
            e(CartesianGrid, { strokeDasharray: "3 3" }),
            e(XAxis, { dataKey: "date" }),
            e(YAxis, null),
            e(Tooltip, null),
            e(Legend, null),
            e(Bar, { dataKey: "netGrowth", fill: "#f97316", name: "Net Growth" })
          )
        )
      )
    );
  }

  function ChangeDynamicsSection(props) {
    const latest = props.dailyMetrics[props.dailyMetrics.length - 1] || {};
    return e(
      Section,
      { title: "Change Dynamics" },
      e(
        "div",
        { className: "kpi-grid" },
        e(KpiCard, {
          title: "Median Change Volume",
          value: formatDecimal(latest.medianChangeVolume),
          subtitle: "7d avg: " + formatDecimal(latest.medianChangeVolumeRolling),
        }),
        e(KpiCard, {
          title: "Median Change Depth",
          value: formatDecimal(latest.medianChangeDepth),
          subtitle: "7d avg: " + formatDecimal(latest.medianChangeDepthRolling),
        })
      ),
      e(
        ChartContainer,
        { title: "Change Volume & Depth" },
        e(
          ResponsiveContainer,
          { width: "100%", height: 240 },
          e(
            LineChart,
            { data: props.dailyMetrics },
            e(CartesianGrid, { strokeDasharray: "3 3" }),
            e(XAxis, { dataKey: "date" }),
            e(YAxis, null),
            e(Tooltip, null),
            e(Legend, null),
            e(Line, { type: "monotone", dataKey: "medianChangeVolume", stroke: "#f97316", name: "Median Volume" }),
            e(Line, { type: "monotone", dataKey: "medianChangeDepth", stroke: "#0ea5e9", name: "Median Depth" })
          )
        )
      )
    );
  }

  function Dashboard(props) {
    const dailyMetrics = props.app.dailyMetrics;
    const systemStatus = props.app.systemStatus;
    return e(
      "div",
      { className: "dashboard" },
      e("div", { className: "page-title" }, props.app.name + " Dashboard"),
      e(SystemStatusSection, { systemStatus: systemStatus }),
      e(EntryRelatedSection, { dailyMetrics: dailyMetrics }),
      e(UserRelatedSection, { dailyMetrics: dailyMetrics }),
      e(DataSetsSection, { dailyMetrics: dailyMetrics }),
      e(ChangeDynamicsSection, { dailyMetrics: dailyMetrics })
    );
  }

  function App() {
    const [selectedAppId, setSelectedAppId] = useState(APPS[0].id);
    const selectedApp = useMemo(
      function () {
        return APPS.find(function (a) {
          return a.id === selectedAppId;
        });
      },
      [selectedAppId]
    );

    return e(
      "div",
      { className: "app-layout" },
      e(Sidebar, {
        apps: APPS,
        selectedAppId: selectedAppId,
        onSelectApp: setSelectedAppId,
      }),
      e(Dashboard, { app: selectedApp })
    );
  }

  const rootElement = document.getElementById("root");
  const root = ReactDOM.createRoot(rootElement);
  root.render(e(App));
})();
