import {Chart, ArcElement} from 'chart.js'
Chart.register(ArcElement);
import React from 'react'
import { Pie } from "react-chartjs-2";
import styles from '@/styles/Home.module.css'

type PieChartProps = {
    labelA: string,
    labelB: string,
    dataA: string,
    dataB: string,
    class: string,
}

const PieChart = (props: PieChartProps) => {

    let labels = [props.labelA ? props.labelA : "stockA", props.labelB ? props.labelA : "stockB" ];
    let datasets = [
      {
        data: [props.dataA ? props.dataA : 0, props.dataB ? props.dataB : 0],
        backgroundColor: ["#003f5c", "#58508d"]
      }
    ]

    return (
        <Pie
            className={`${props.class} ${styles.pieChart}`}
            data={{
                labels: labels,
                datasets: datasets
            }}
      />
    )
}

export default PieChart