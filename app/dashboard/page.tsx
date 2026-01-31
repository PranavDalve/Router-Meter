"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Downtime } from "@/components/Downtime"
import { cn } from "@/lib/utils"

type RowData = {
  id?: number
  device_id: string
  timestamp: string | number
  type: number
  details: {
    domain_activity: {
      domain: string
      category: string
      platform: string
      source_ip: string
      destination_ip?: string
    }
  }
}

const columns: ColumnDef<RowData>[] = [
  {
    id: "srNo",
    header: "Sr No",
    cell: ({ row, table }) => row.index + 1 + table.getState().pagination.pageIndex * table.getState().pagination.pageSize,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "device_id",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Device ID <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Timestamp <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const ts = row.getValue("timestamp") as string | number
      const timestampNum = typeof ts === "string" ? Number(ts) : ts
      const date = new Date(timestampNum * 1000)
      return <div>{isNaN(date.getTime()) ? "Invalid date" : date.toLocaleString()}</div>
    },
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorFn: (row) => row?.details?.domain_activity?.platform ?? "N/A",
    id: "platform",
    header: "Platform",
  },
  {
    accessorFn: (row) => row?.details?.domain_activity?.source_ip ?? "N/A",
    id: "sourceIP",
    header: "Source IP",
  },
  {
    accessorFn: (row) => row?.details?.domain_activity?.category ?? "N/A",
    id: "category",
    header: "Category",
  },
]

export default function DashboardPage() {
  
  const [data, setData] = React.useState<RowData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [autoRefresh, setAutoRefresh] = React.useState(false)
  const [refreshInterval, setRefreshInterval] = React.useState<3 | 5 | 10>(5)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedIP, setSelectedIP] = React.useState<string>("")
  const [downtimeData, setDowntimeData] = React.useState<any>(null)

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("http://3.111.204.121/api/router-event")
      if (!response.ok) throw new Error(`Failed: ${response.status}`)
      const fetchedData: RowData[] = await response.json()
      setData(fetchedData)
    } catch (err: any) {
      setError(err.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  React.useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, refreshInterval * 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, refreshInterval, fetchData])

  const uniqueIPs = React.useMemo(() => {
    if (!Array.isArray(data)) return []
    const ips = new Set(
      data
        .map(row => row?.details?.domain_activity?.source_ip)
        .filter((ip): ip is string => typeof ip === "string" && ip.trim().length > 0)
    )
    return Array.from(ips).sort()
  }, [data])

  // Downtime calculation (unchanged from previous version)
  React.useEffect(() => {
    if (!selectedIP || data.length === 0) {
      setDowntimeData(null)
      return
    }

    const ipLogs = data
      .filter(row => row?.details?.domain_activity?.source_ip === selectedIP)
      .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))

    if (ipLogs.length === 0) {
      setDowntimeData(null)
      return
    }

    const SESSION_GAP = 1800
    const sessions: { start: number; end: number; platforms: Set<string> }[] = []
    let currentSession = {
      start: Number(ipLogs[0].timestamp),
      end: Number(ipLogs[0].timestamp),
      platforms: new Set([ipLogs[0].details.domain_activity.platform]),
    }

    for (let i = 1; i < ipLogs.length; i++) {
      const log = ipLogs[i]
      const ts = Number(log.timestamp)
      if (ts - currentSession.end <= SESSION_GAP) {
        currentSession.end = ts
        currentSession.platforms.add(log.details.domain_activity.platform)
      } else {
        sessions.push(currentSession)
        currentSession = {
          start: ts,
          end: ts,
          platforms: new Set([log.details.domain_activity.platform]),
        }
      }
    }
    sessions.push(currentSession)

    const totalActiveTime = sessions.reduce((sum, s) => sum + (s.end - s.start), 0)

    const platformMap: Record<string, number> = {}
    sessions.forEach(session => {
      const duration = session.end - session.start
      session.platforms.forEach(plat => {
        platformMap[plat] = (platformMap[plat] || 0) + duration
      })
    })

    const platformTimes = Object.entries(platformMap).map(([platform, duration]) => ({
      platform,
      duration,
    }))

    let totalDowntime = 0
    for (let i = 1; i < sessions.length; i++) {
      const gap = sessions[i].start - sessions[i - 1].end
      if (gap > SESSION_GAP) totalDowntime += gap
    }

    setDowntimeData({
      totalActiveTime,
      totalDowntime,
      platformTimes,
      sessionCount: sessions.length,
    })
  }, [selectedIP, data])

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable<RowData>({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const filteredRows = table.getFilteredRowModel().rows.length
  const totalRows = data.length
  const startRow = pageIndex * pageSize + 1
  const endRow = Math.min(startRow + pageSize - 1, filteredRows)

  return (
    <div className="flex flex-col bg-background ml-10 min-h-screen">
      <main className="flex-1 container mx-auto py-8 px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Network Activity</h1>
        </div>
        <Separator className="-mt-5 mb-2" />

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive flex items-center justify-between">
            <span className="font-medium">Failed to load data: {error}</span>
            <Button size="sm" variant="outline" onClick={fetchData}>
              Retry
            </Button>
          </div>
        )}

        {(loading || data.length > 0) && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
              <Input
                placeholder="Filter by Device ID..."
                value={(table.getColumn("device_id")?.getFilterValue() as string) ?? ""}
                onChange={(e) => table.getColumn("device_id")?.setFilterValue(e.target.value)}
                className="max-w-sm"
              />

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={autoRefresh ? "default" : "outline"}
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
                    Refresh: {autoRefresh ? "On" : "Off"}
                  </Button>

                  {autoRefresh && (
                    <Select
                      value={`${refreshInterval}`}
                      onValueChange={(v) => setRefreshInterval(Number(v) as 3 | 5 | 10)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3s</SelectItem>
                        <SelectItem value="5">5s</SelectItem>
                        <SelectItem value="10">10s</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Downtime
                  data={data}
                  open={dialogOpen}
                  onOpenChange={setDialogOpen}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Columns <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {table.getAllColumns().filter(col => col.getCanHide()).map(col => (
                      <DropdownMenuCheckboxItem
                        key={col.id}
                        className="capitalize"
                        checked={col.getIsVisible()}
                        onCheckedChange={(v) => col.toggleVisibility(!!v)}
                      >
                        {col.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Table Container */}
            <div className="rounded-md border overflow-hidden flex flex-col">
              {/* Scrollable Table Area */}
              <div className="flex-1 overflow-auto max-h-[60vh]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                    {table.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>

                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map(row => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map(cell => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-32 text-center">
                          <p className="text-muted-foreground text-lg">
                            {loading ? "Loading data..." : "No matching records found"}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Fixed Footer - always visible */}
              <TableFooter className="border-t bg-muted/30 shrink-0">
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-3 px-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                      <div>
                        Showing {startRow}–{endRow} of {filteredRows} entries
                        {filteredRows !== totalRows && ` (filtered from ${totalRows} total)`}
                      </div>

                      <div className="flex items-center gap-4">
                        <Select
                          value={`${pageSize}`}
                          onValueChange={value => table.setPageSize(Number(value))}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Rows" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">
                            Page {pageIndex + 1}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </div>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="text-center py-20 text-xl text-muted-foreground">
            No data found.
          </div>
        )}
      </main>
    </div>
  )
}