import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import WebView from 'react-native-webview';
import { getAirportCoords } from '@/lib/airportCoords';

// Shape of data injected into the Leaflet HTML
interface MapPayload {
  flight: string;
  origIata: string; origIcao: string;
  destIata: string; destIcao: string;
  originCoords: [number, number] | null;
  destCoords:   [number, number] | null;
  hasCoords: boolean;
  progress: number;        // 0–1 along route (estimated when sandbox)
  landed: boolean;
  isSandbox: boolean;      // flip to false when live API is wired in
  departure: string;
  arrival: string;
  aircraft: string;
  // live fields — null until subscription activated
  livePos:     [number, number] | null;
  liveHeading: number | null;
  altitude:    number | null;   // feet
  speed:       number | null;   // knots
  heading:     number | null;   // degrees
}

function buildMapHtml(d: MapPayload): string {
  const json = JSON.stringify(d);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{height:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f0f0}
    #map{position:absolute;top:0;left:0;right:0;bottom:216px}
    #panel{
      position:absolute;left:0;right:0;bottom:0;height:216px;
      background:#fff;border-top:1px solid #e5e5e5;
      padding:12px 16px 20px;overflow:hidden
    }
    .banner{
      background:#FFF3CD;color:#856404;border-radius:8px;
      padding:5px 10px;font-size:11px;text-align:center;margin-bottom:10px
    }
    .hrow{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
    .badge{background:#C8102E;color:#fff;padding:3px 12px;border-radius:7px;font-weight:700;font-size:13px;letter-spacing:.5px}
    .status{padding:3px 9px;border-radius:7px;font-size:11px;font-weight:600}
    .landed{background:#D4EDDA;color:#155724}
    .inflight{background:#CCE5FF;color:#004085}
    .route{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:10px}
    .ap{text-align:center}
    .iata{font-size:24px;font-weight:800;line-height:1.1}
    .icao{font-size:10px;opacity:.4;margin-top:2px}
    .rarr{font-size:18px;color:#C8102E}
    .stats{display:flex;justify-content:space-around}
    .stat{text-align:center}
    .sl{font-size:9px;opacity:.5;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
    .sv{font-size:15px;font-weight:700}
    .live-stats{display:flex;justify-content:space-around;margin-top:10px;
      padding-top:10px;border-top:1px solid #eee}
    .leaflet-tooltip{
      background:#C8102E!important;color:#fff!important;border:none!important;
      border-radius:5px!important;font-weight:700!important;font-size:11px!important;
      padding:2px 7px!important;box-shadow:0 2px 6px rgba(0,0,0,.2)!important
    }
    .leaflet-tooltip-top::before{border-top-color:#C8102E!important}
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="panel"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
  (function(){
    var D=${json};

    /* Great-circle interpolation */
    function r(d){return d*Math.PI/180}
    function deg(x){return x*180/Math.PI}
    function gcPts(la1,lo1,la2,lo2,n){
      var p1=r(la1),l1=r(lo1),p2=r(la2),l2=r(lo2);
      var ang=Math.acos(Math.min(1,Math.sin(p1)*Math.sin(p2)+Math.cos(p1)*Math.cos(p2)*Math.cos(l2-l1)));
      if(ang<0.001) return [[la1,lo1],[la2,lo2]];
      var pts=[];
      for(var i=0;i<=n;i++){
        var f=i/n,A=Math.sin((1-f)*ang)/Math.sin(ang),B=Math.sin(f*ang)/Math.sin(ang);
        var x=A*Math.cos(p1)*Math.cos(l1)+B*Math.cos(p2)*Math.cos(l2);
        var y=A*Math.cos(p1)*Math.sin(l1)+B*Math.cos(p2)*Math.sin(l2);
        var z=A*Math.sin(p1)+B*Math.sin(p2);
        pts.push([deg(Math.atan2(z,Math.sqrt(x*x+y*y))),deg(Math.atan2(y,x))]);
      }
      return pts;
    }

    /* Bearing between two points */
    function bearing(la1,lo1,la2,lo2){
      var dL=r(lo2-lo1);
      var y=Math.sin(dL)*Math.cos(r(la2));
      var x=Math.cos(r(la1))*Math.sin(r(la2))-Math.sin(r(la1))*Math.cos(r(la2))*Math.cos(dL);
      return (deg(Math.atan2(y,x))+360)%360;
    }

    var map=L.map('map',{zoomControl:true,attributionControl:true});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',maxZoom:18
    }).addTo(map);

    if(D.hasCoords){
      var o=D.originCoords, d2=D.destCoords;
      var pts=gcPts(o[0],o[1],d2[0],d2[1],70);

      /* Flown portion (solid red) */
      var splitIdx=Math.min(Math.floor(D.progress*pts.length),pts.length-1);
      var flown=pts.slice(0,splitIdx+1);
      var remaining=pts.slice(splitIdx);

      if(flown.length>1)
        L.polyline(flown,{color:'#C8102E',weight:2.5,opacity:.9}).addTo(map);
      if(remaining.length>1)
        L.polyline(remaining,{color:'#C8102E',weight:2,opacity:.35,dashArray:'6,5'}).addTo(map);

      /* Airport markers */
      function apMark(coords,iata,dir){
        L.circleMarker(coords,{radius:7,color:'#C8102E',weight:2.5,fillColor:'#fff',fillOpacity:1})
         .bindTooltip(iata,{permanent:true,direction:dir||'top',offset:[0,-5]}).addTo(map);
      }
      apMark(o, D.origIata, 'left');
      apMark(d2, D.destIata, 'right');

      /* Airplane position */
      var planePos=D.livePos||pts[splitIdx];
      var hdg=D.liveHeading!=null?D.liveHeading:
        (splitIdx<pts.length-1?bearing(pts[splitIdx][0],pts[splitIdx][1],pts[Math.min(splitIdx+1,pts.length-1)][0],pts[Math.min(splitIdx+1,pts.length-1)][1]):0);

      var planeIcon=L.divIcon({
        html:'<div style="font-size:26px;transform:rotate('+(hdg-45)+'deg);filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));line-height:1">✈️</div>',
        iconAnchor:[13,13],className:''
      });
      L.marker(planePos,{icon:planeIcon,zIndexOffset:1000}).addTo(map);

      map.fitBounds([o,d2],{padding:[70,70]});
    } else {
      map.setView([20,0],2);
    }

    /* Info panel */
    var landed=D.landed;
    var html='';
    if(D.isSandbox)
      html+='<div class="banner">⚠️ Sandbox — estimated position. Live GPS tracking requires FR24 subscription.</div>';
    html+='<div class="hrow"><span class="badge">'+D.flight+'</span>'
        +'<span class="status '+(landed?'landed':'inflight')+'">'+(landed?'✓ Landed':'▶ In Flight')+'</span></div>'
        +'<div class="route">'
          +'<div class="ap"><div class="iata">'+D.origIata+'</div><div class="icao">'+D.origIcao+'</div></div>'
          +'<div class="rarr">✈</div>'
          +'<div class="ap"><div class="iata">'+D.destIata+'</div><div class="icao">'+D.destIcao+'</div></div>'
        +'</div>'
        +'<div class="stats">'
          +'<div class="stat"><div class="sl">Departure</div><div class="sv">'+D.departure+'</div></div>'
          +'<div class="stat"><div class="sl">Arrival</div><div class="sv">'+D.arrival+'</div></div>'
          +'<div class="stat"><div class="sl">Aircraft</div><div class="sv">'+D.aircraft+'</div></div>'
        +'</div>';
    if(D.livePos)
      html+='<div class="live-stats">'
        +'<div class="stat"><div class="sl">Altitude</div><div class="sv">'+(D.altitude||'—')+' ft</div></div>'
        +'<div class="stat"><div class="sl">Speed</div><div class="sv">'+(D.speed||'—')+' kts</div></div>'
        +'<div class="stat"><div class="sl">Heading</div><div class="sv">'+(D.heading||'—')+'°</div></div>'
        +'</div>';
    document.getElementById('panel').innerHTML=html;
  })();
  </script>
</body>
</html>`;
}

export default function FlightTrackingMapScreen() {
  const params = useLocalSearchParams<{
    fr24Id: string; flightNum: string;
    origIata: string; origIcao: string;
    destIata: string; destIcao: string;
    takeoff: string; flightTime: string;
    aircraft: string; reg: string;
    flightEnded: string; departure: string; arrival: string;
  }>();

  const payload = useMemo<MapPayload>(() => {
    const originCoords = getAirportCoords(params.origIata ?? '');
    const destCoords   = getAirportCoords(params.destIata ?? '');
    const landed       = params.flightEnded === 'true';

    // Estimate how far along the route the plane is
    let progress = landed ? 1.0 : 0.5;
    if (!landed && params.takeoff && params.flightTime) {
      const takeoffMs = new Date(
        params.takeoff.includes('Z') ? params.takeoff : params.takeoff + 'Z'
      ).getTime();
      const elapsed = (Date.now() - takeoffMs) / 1000;
      progress = Math.max(0, Math.min(0.98, elapsed / Number(params.flightTime)));
    }

    return {
      flight:       params.flightNum   ?? '',
      origIata:     params.origIata    ?? '',
      origIcao:     params.origIcao    ?? '',
      destIata:     params.destIata    ?? '',
      destIcao:     params.destIcao    ?? '',
      originCoords, destCoords,
      hasCoords:    !!(originCoords && destCoords),
      progress,
      landed,
      isSandbox:    true,   // set false once getFlightPositions() is wired in
      departure:    params.departure   ?? '—',
      arrival:      params.arrival     ?? '—',
      aircraft:     [params.aircraft, params.reg].filter(Boolean).join(' · ') || '—',
      // live — all null until subscription activates
      livePos:      null,
      liveHeading:  null,
      altitude:     null,
      speed:        null,
      heading:      null,
    };
  }, [params]);

  const html = useMemo(() => buildMapHtml(payload), [payload]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none' } as any}
          sandbox="allow-scripts"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.fill}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fill: { flex: 1 },
});
