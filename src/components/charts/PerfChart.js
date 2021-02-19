import React, { useRef } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';

// data
import { data } from '../../data/data1';

am4core.useTheme(am4themes_animated);

const CHART_CONTAINER = 'perf-chart';

function PerfChart() {
  const chartRef = useRef(null);

  function createSeries(
    fieldX,
    fieldY,
    name,
    dateAxis,
    valueAxis,
    lineColor,
    isDashed = false,
    showArea = false,
    groupTooltip
  ) {
    if (!chartRef.current) return;

    // Init series
    let series = chartRef.current.series.push(new am4charts.LineSeries());
    series.name = name;
    series.dataFields.valueY = fieldY;
    series.dataFields.dateX = fieldX;
    series.strokeWidth = 3;
    series.stroke = am4core.color(lineColor);
    series.tooltip.pointerOrientation = 'down';
    series.tooltip.getFillFromObject = false;
    series.tooltip.background.fillOpacity = 1;
    series.tooltip.background.fill = am4core.color('#2a2b2e');
    series.tooltip.background.stroke = am4core.color('#2a2b2e');
    series.tooltip.label.fontSize = 12;
    series.tooltip.background.pointerLength = 0;
    series.tooltip.label.paddingLeft = 0;
    series.tooltip.label.paddingRight = 0;
    series.tooltip.label.paddingBottom = 0;
    series.tooltip.label.interactionsEnabled = true;
    series.tooltip.clickable = true;
    series.tooltip.keepTargetHover = true;
    series.tooltip.dy = -5;
    series.tooltipHTML = `<div style="border-bottom:1px solid rgba(223, 225, 237, 0.10);padding:0 8px 8px 8px;text-align:center;">{dateX}</div><div style="padding:8px;text-align:center;">{valueY}</div>`;
    series.tensionX = 0.8;
    series.showOnInit = false;

    if (name === 'Potential') {
      series.zIndex = 20;
    }

    // Tooltip shadow
    let tooltipShadow = series.tooltip.background.filters.getIndex(0);
    tooltipShadow.dx = 5;
    tooltipShadow.dy = 5;
    tooltipShadow.blur = 8;
    tooltipShadow.color = am4core.color('#2a2b2e');
    tooltipShadow.opacity = 0.2;

    // Add bullet for optimization
    let circleBullet = series.bullets.push(new am4charts.CircleBullet());
    circleBullet.circle.radius = 6;
    circleBullet.circle.fill = lineColor;
    circleBullet.circle.stroke = am4core.color('#fff');
    circleBullet.circle.strokeWidth = 3;
    circleBullet.propertyFields.disabled = 'optimizationTooltipDisabled';
    series.adapter.add('tooltipHTML', function (tooltipHTML, target) {
      if (
        target.tooltipDataItem.dataContext.optimizationTooltipDisabled === false
      ) {
        return `<div style="overflow:hidden"><div style="display:flex;justify-content:space-between;padding:0 16px 16px 16px;"><span style="margin-right:15px;">Next week potential</span><span style="color:#0ec76a;">{optimizationPotentialPercentage}%</span></div><button style="width:100%;padding:12px 24px;border:none;outline:none;cursor:pointer;color:#fff;text-align:center;background-color:#0ec76a;">View proposal</button></div>`;
      }
      return tooltipHTML;
    });

    // Bullet shadow
    let bulletShadow = circleBullet.filters.push(
      new am4core.DropShadowFilter()
    );
    bulletShadow.opacity = 0.1;

    if (isDashed) {
      series.strokeDasharray = '16,6';
    }

    if (showArea) {
      series.dataFields.openValueY = 'baselinePerformance';
      series.fill = series.stroke;
      series.fillOpacity = 0.1;
    }

    if (groupTooltip) {
      // Set up tooltip
      series.adapter.add('tooltipHTML', function (ev) {
        let content = `<div style="border-bottom:1px solid rgba(223, 225, 237, 0.10);padding:0 8px 8px 8px;text-align:center;margin-bottom:8px;">{dateX}</div>`;
        chartRef.current.series.each(function (item) {
          if (item.name === 'Effective') return;
          content += `<div style="display:block;padding:0 8px 8px 8px;"><span style="color:${item.stroke}">●</span> {${item.dataFields.valueY}}</div>`;
        });
        return content;
      });
    }
  }

  React.useEffect(() => {
    if (!chartRef.current) {
      chartRef.current = am4core.create(CHART_CONTAINER, am4charts.XYChart);

      chartRef.current.data = data;

      chartRef.current.paddingLeft = 0;

      // chartRef.current.formatDate(d MMM yyyy) = data;
      chartRef.current.dateFormatter.dateFormat = 'MMM d, yyyy';

      // Add date axis
      let dateAxis = chartRef.current.xAxes.push(new am4charts.DateAxis());
      dateAxis.renderer.labels.template.fontSize = 12;
      dateAxis.renderer.labels.template.fill = am4core.color(
        'rgba(183,186,199,0.8)'
      );
      dateAxis.renderer.grid.template.strokeOpacity = 0;
      // dateAxis.renderer.grid.template.fill = am4core.color(
      //   nexyColors.cloudyBlue80
      // );
      // dateAxis.gridIntervals.setAll([{ timeUnit: 'week', count: 2 }]);

      // Add value axis
      let valueAxis = chartRef.current.yAxes.push(new am4charts.ValueAxis());
      valueAxis.renderer.grid.template.stroke = am4core.color('#f0f2fa');
      valueAxis.renderer.grid.template.strokeOpacity = 1;
      valueAxis.renderer.labels.template.fill = am4core.color(
        'rgba(183,186,199,0.8)'
      );
      valueAxis.renderer.labels.template.fontSize = 12;

      // Init series
      createSeries(
        'timestamp',
        'valuePastCumulative',
        'Effective',
        dateAxis,
        valueAxis,
        '#05a8fa',
        false,
        false,
        false
      );
      createSeries(
        'timestamp',
        'expectedPerformance',
        'Potential',
        dateAxis,
        valueAxis,
        '#0ec76a',
        false,
        true,
        true
      );
      createSeries(
        'timestamp',
        'baselinePerformance',
        'Predicted',
        dateAxis,
        valueAxis,
        '#d7d0f7',
        true,
        false,
        true
      );

      // Add cursor
      chartRef.current.cursor = new am4charts.XYCursor();
      chartRef.current.cursor.maxTooltipDistance = -1;

      // Add legend
      chartRef.current.legend = new am4charts.Legend();
      chartRef.current.legend.position = 'bottom';
      chartRef.current.legend.contentAlign = 'left';
      chartRef.current.legend.paddingTop = 20;

      // Disable click on legend
      chartRef.current.legend.itemContainers.template.clickable = false;
      chartRef.current.legend.itemContainers.template.focusable = false;
      chartRef.current.legend.itemContainers.template.cursorOverStyle =
        am4core.MouseCursorStyle.default;

      // Disable axis lines
      chartRef.current.cursor.lineX.disabled = true;
      chartRef.current.cursor.lineY.disabled = true;

      // Disable axis tooltips
      dateAxis.cursorTooltipEnabled = false;
      valueAxis.cursorTooltipEnabled = false;

      // Disable zoom
      chartRef.current.cursor.behavior = 'none';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle component unmounting, dispose chart
  React.useEffect(() => {
    return () => {
      chartRef.current && chartRef.current.dispose();
    };
  }, []);

  return (
    <div
      id={CHART_CONTAINER}
      data-cy={'campaignPerformanceChart'}
      style={{
        width: '100%',
        height: '350px',
        marginBottom: '50px',
      }}
    />
  );
}

export default PerfChart;
