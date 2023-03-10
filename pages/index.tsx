import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import React, { useEffect, useState } from 'react'
import PieChart from '@/src/PieChart'
import tickers from "@/src/Tickers"

const index = () => {

  let [stockData, setStockData] = useState()

  let [stockA, setStockA] = useState("SAVE")
  let [stockB, setStockB] = useState("AZA")

  let [compStockA, setCompStockA] = useState("SAVE")
  let [compStockB, setCompStockB] = useState("AZA")

  const toHumanString = (price: number): string => {
    return formatter.format(price).substring(0,6) + " MSEK"
  };

  useEffect(() => {
    fetch(`/api/${stockA}/${stockB}`)
      .then(response => {
        if(response.ok) {
          return response.json()
        }
        throw response;
      })
      .then(data => {
        console.log(data)
        if(data["stockA"].error == true || data["stockB"].error == true) {
          throw data;
        }
        setStockData(data);
      });
  }, [])

  async function loadStock() {
    setStockData(undefined)
    fetch(`/api/${compStockA}/${compStockB}`)
    .then(response => {
      if(response.ok) {
        return response.json()
      }
      throw response;
    })
    .then(data => {
      console.log(data);
      setStockA(compStockA);
      setStockB(compStockB);
      setCompStockA("SAVE");
      setCompStockB("AZA");
      setStockData(data);
    });
  }
  
  const formatter = new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
  });

  let size = useWindowSize();

  return (
    <>
      <Head>
        <title>Aktiematchen</title>
        <meta name="description" content="Jämnför bursen" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        { stockData ?
          <div className={styles.container}>
            <div className={styles.compare}>
              {/* <input placeholder="Företag 1 (SAVE)" value={compStockA} onChange={(e) => setCompStockA(e.target.value)} />
              <input placeholder="Företag 2 (AZA)" value={compStockB} onChange={(e) => setCompStockB(e.target.value)} /> */}
              <select value={compStockA} onChange={(e) => setCompStockA(e.target.value)} placeholder="Företag 1 (SAVE)">
                {
                  tickers.map((val, idx) => {
                    return (<option>
                      {val}
                    </option>)
                  })
                }
              </select>
              <select value={compStockB} onChange={(e) => setCompStockB(e.target.value)} placeholder="Företag 2 (AZA)">
                {
                  tickers.map((val, idx) => {
                    return (<option>
                      {val}
                    </option>)
                  })
                }
              </select>
              <button onClick={() => loadStock()}>Jämför</button>
            </div>
            <div className={`${styles.header} ${styles.headerA}`}>
              <div className={styles.name}>
                {stockData["stockA"]["name"]}
              </div>
              <div className={styles.ticker}>
                {stockA}
              </div>
            </div>

            <div className={`${styles.header} ${styles.headerB}`}>
              <div className={styles.name}>
              {stockData["stockB"]["name"]}
              </div>
              <div className={styles.ticker}>
                {stockB}
              </div>
            </div>

            
            <div className={`${styles.marketCap} ${styles.marketCapA}`}>
              <div>
                Market cap
              </div>
              <div>
                {toHumanString(stockData["stockA"]["response"]["marketCap"])}
              </div>
              <div>
                {(stockData["stockA"]["response"]["marketCap"] / (stockData["stockA"]["response"]["marketCap"] + stockData["stockB"]["response"]["marketCap"]) * 100).toString().substring(0,4)}%
              </div>
            </div>
            <PieChart class={styles.marketCapPie} labelA="SAVE" labelB="AZA" dataA={stockData["stockB"]["response"]["marketCap"]} dataB={stockData["stockA"]["response"]["marketCap"]} />
            <div className={`${styles.marketCap} ${styles.marketCapB}`}>
              <div>
                Market cap
              </div>
              <div>
              {toHumanString(stockData["stockB"]["response"]["marketCap"])}
              </div>
              <div>
                {(stockData["stockB"]["response"]["marketCap"] / (stockData["stockA"]["response"]["marketCap"] + stockData["stockB"]["response"]["marketCap"]) * 100).toString().substring(0,4)}%
              </div>
            </div>
            
            <div className={`${styles.peRatio} ${styles.peRatioA}`}>
              <div>
                P/E Ratio
              </div>
              <div>
                {stockData["stockA"]["response"]["peRatio"]}
              </div>
              <div>
                {(stockData["stockA"]["response"]["peRatio"] / (stockData["stockA"]["response"]["peRatio"] + stockData["stockB"]["response"]["peRatio"]) * 100).toString().substring(0,4)}%
              </div>
            </div>
            <PieChart class={styles.peRatioPie} labelA="SAVE" labelB="AZA" dataA={stockData["stockB"]["response"]["peRatio"]} dataB={stockData["stockA"]["response"]["peRatio"]} />
            <div className={`${styles.peRatio} ${styles.peRatioB}`}>
              <div>
                P/E Ratio
              </div>
              <div>
                {stockData["stockB"]["response"]["peRatio"]}
              </div>
              <div>
                {(stockData["stockB"]["response"]["peRatio"] / (stockData["stockA"]["response"]["peRatio"] + stockData["stockB"]["response"]["peRatio"]) * 100).toString().substring(0,4)}%
              </div>
            </div>
          </div>
          : 
          <div>
            Loading...
          </div>
        }
      </main>
    </>
  )
}

export default index

function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: 0  ,
    height: 0,
  });

  useEffect(() => {
    // only execute all the code below in client side
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener("resize", handleResize);
     
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowSize
}
