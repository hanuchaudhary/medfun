import {
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  createChart,
  CrosshairMode,
  ISeriesApi,
  UTCTimestamp,
  IChartApi,
} from "lightweight-charts";

interface KlineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface LayoutOptions {
  background: string;
  color: string;
}

export class ChartManager {
  private candleSeries: ISeriesApi<"Candlestick">;
  private volumeSeries: ISeriesApi<"Histogram">;
  private lastUpdateTime: number = 0;
  private chart: IChartApi | null;
  private isDisposed: boolean = false;
  private currentBar: {
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: number | null;
  } = {
    open: null,
    high: null,
    low: null,
    close: null,
    volume: null,
  };

  constructor(
    ref: HTMLElement,
    initialData: KlineData[],
    layout: LayoutOptions
  ) {
    const chart = createChart(ref, {
      autoSize: true,
      overlayPriceScales: {
        ticksVisible: true,
        borderVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: "rgba(224, 224, 224, 0.5)",
          style: 2,
        },
        horzLine: {
          width: 1,
          color: "rgba(224, 224, 224, 0.5)",
          style: 2,
        },
      },
      rightPriceScale: {
        visible: true,
        borderVisible: false,
        ticksVisible: true,
        entireTextOnly: true,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        tickMarkFormatter: (time: UTCTimestamp) => {
          const date = new Date(time * 1000);
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        },
      },
      grid: {
        horzLines: {
          color: "rgba(197, 203, 206, 0.1)",
          visible: true,
        },
        vertLines: {
          color: "rgba(197, 203, 206, 0.1)",
          visible: true,
        },
      },
      layout: {
        background: {
          type: ColorType.Solid,
          color: layout.background,
        },
        textColor: layout.color,
        fontSize: 12,
      },
    });
    this.chart = chart;

    this.candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#30b561",
      wickUpColor: "#22c55e",
      borderUpColor: "#22c55e",
      downColor: "#ef4444",
      wickDownColor: "#ef4444",
      borderDownColor: "#ef4444",
    });
    this.candleSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.1,
        bottom: 0.3,
      },
      borderVisible: false,
    });

    this.volumeSeries = chart.addSeries(HistogramSeries, {
      color: "rgba(38, 166, 154, 0.5)",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    });
    this.volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.9,
        bottom: 0,
      },
      borderVisible: false,
    });

    const candleData = initialData.map((data) => ({
      time: Math.floor(data.timestamp / 1000) as UTCTimestamp,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
    }));

    const volumeData = initialData.map((data, index) => ({
      time: Math.floor(data.timestamp / 1000) as UTCTimestamp,
      value: data.volume,
      color:
        data.close >= data.open
          ? "rgba(38, 166, 154, 0.5)"
          : "rgba(239, 83, 80, 0.5)",
    }));

    this.candleSeries.setData(candleData);
    this.volumeSeries.setData(volumeData);

    chart.timeScale().fitContent();
  }

  public setData(data: KlineData[]) {
    if (this.isDisposed || !this.chart) {
      console.warn("Attempted to update a disposed chart");
      return;
    }

    const candleData = data.map((d) => ({
      time: Math.floor(d.timestamp / 1000) as UTCTimestamp,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumeData = data.map((d) => ({
      time: Math.floor(d.timestamp / 1000) as UTCTimestamp,
      value: d.volume,
      color:
        d.close >= d.open
          ? "rgba(38, 166, 154, 0.5)"
          : "rgba(239, 83, 80, 0.5)",
    }));

    // setData preserves the current visible range
    this.candleSeries.setData(candleData);
    this.volumeSeries.setData(volumeData);
  }

  public update(updatedData: KlineData & { newCandleInitiated?: boolean }) {
    if (this.isDisposed || !this.chart) {
      console.warn("Attempted to update a disposed chart");
      return;
    }

    if (!this.lastUpdateTime) {
      this.lastUpdateTime = new Date().getTime();
    }

    const time = Math.floor(updatedData.timestamp / 1000) as UTCTimestamp;

    this.candleSeries.update({
      time,
      open: updatedData.open,
      high: updatedData.high,
      low: updatedData.low,
      close: updatedData.close,
    });

    this.volumeSeries.update({
      time,
      value: updatedData.volume,
      color:
        updatedData.close >= updatedData.open
          ? "rgba(38, 166, 154, 0.5)"
          : "rgba(239, 83, 80, 0.5)",
    });

    this.currentBar = {
      open: updatedData.open,
      high: updatedData.high,
      low: updatedData.low,
      close: updatedData.close,
      volume: updatedData.volume,
    };

    if (updatedData.newCandleInitiated) {
      this.lastUpdateTime = updatedData.timestamp;
    }
  }

  public destroy() {
    if (this.isDisposed || !this.chart) {
      return;
    }

    try {
      this.chart.remove();
      this.chart = null;
      this.isDisposed = true;
    } catch (error) {
      console.error("Error while destroying chart:", error);
    }
  }
}
