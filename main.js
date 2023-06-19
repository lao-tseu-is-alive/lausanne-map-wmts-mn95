import './style.css'
import 'ol/ol.css'
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import OlLayerTile from 'ol/layer/Tile';
import OlSourceWMTS, {optionsFromCapabilities} from 'ol/source/WMTS';
import OlFormatWMTSCapabilities from 'ol/format/WMTSCapabilities';
import OlProjection from 'ol/proj/Projection';
import proj4 from 'proj4';
import {register} from 'ol/proj/proj4';


const lausanneGareinMN95 = [2537968.5, 1152088.0];
const defaultBaseLayer = 'fonds_geo_osm_bdcad_couleur';

const urlLausanneMN95 = 'https://tilesmn95.lausanne.ch/tiles/1.0.0/LausanneWMTS.xml';
proj4.defs(
'EPSG:2056',
'+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs');
const LausanneLonLat = [6.62925, 46.51735];
const MaxExtent = [2532500, 1149000, 2545625, 1161000];
register(proj4);
const swissProjection = new OlProjection({
		code: 'EPSG:2056',
		extent: MaxExtent,
		units: 'm',
});
const parser = new OlFormatWMTSCapabilities();
const isNullOrUndefined = (v) => typeof variable === 'undefined' || variable === null || variable === '';
const setBaseLayer = (olMap, baseLayerName) => {
		console.log(`## in setBaseLayer(${baseLayerName})`);
		const localDebug = false;
		let isBaseLayerNameFound = false;
		olMap.getLayers()
		     .forEach((layer) => {
				     const type = layer.get('type');
				     const source = layer.getSource();
				     console.log(`### layername : ${source.layer_}`)
				     console.log(`### type : ${layer.get('type')}`)
				     if (type === 'base') {
						     const currentBaseLayer = source.getLayer();
						     console.log(`currentBaseLayer : ${currentBaseLayer}`)
						     if (currentBaseLayer === baseLayerName) {
								     layer.setVisible(true);
								     isBaseLayerNameFound = true;
						     } else {
								     layer.setVisible(false);
						     }
						     if (localDebug) {
								     console.log(`layers : ${currentBaseLayer} [${type}]
                 title : ${layer.get('title')}
                 isvisible: ${layer.get('visible')}`, layer, source);
						     }
				     }
		     });
		if (!isBaseLayerNameFound) {
				console.log(`WARNING : The layer ${baseLayerName} was not found !`);
		}
};


function getWmtsSource (WMTSCapabilitiesParsed, layerName) {
		const localDebug = false;
		if (localDebug) log.t(`layerName: ${layerName}`);
		const WMTSOptions = optionsFromCapabilities(WMTSCapabilitiesParsed, {
				layer: layerName,
				matrixSet: 'EPSG2056',
				format: 'image/png',
				style: 'default',
				crossOrigin: 'anonymous',
		});
		return new OlSourceWMTS(WMTSOptions);
}

function createBaseOlLayerTile (parsedWmtsCapabilities, title, layerName, visible = false) {
		return new OlLayerTile({
				title,
				type: 'base',
				visible,
				source: getWmtsSource(parsedWmtsCapabilities, layerName),
		});
}

async function getWMTSCapabilitiesFromUrl (url) {
		const response = await fetch(url);
		if (!response.ok) {
				const message = `###!### ERROR in getWMTSCapabilitiesFromUrl when doing fetch(${url}: http status: ${response.status}`;
				throw new Error(message);
		}
		const WMTSCapabilities = await response.text();
		return WMTSCapabilities;
}

async function getWmtsBaseLayers (url) {
		const arrWmtsLayers = [];
		try {
				const WMTSCapabilities = await getWMTSCapabilitiesFromUrl(url);
				const WMTSCapabilitiesParsed = parser.read(WMTSCapabilities);
				console.log(`## in getWmtsBaseLayers(${url} : WMTSCapabilitiesParsed : \n`, WMTSCapabilitiesParsed);
				arrWmtsLayers.push(createBaseOlLayerTile(
				WMTSCapabilitiesParsed,
				'Orthophoto 2016 (Lausanne)',
				'orthophotos_ortho_lidar_2016',
				(defaultBaseLayer === 'orthophotos_ortho_lidar_2016'),
				));
				arrWmtsLayers.push(createBaseOlLayerTile(
				WMTSCapabilitiesParsed,
				'Fond cadastral (Lausanne)',
				'fonds_geo_osm_bdcad_gris',
				(defaultBaseLayer === 'fonds_geo_osm_bdcad_gris'),
				));
				arrWmtsLayers.push(createBaseOlLayerTile(
				WMTSCapabilitiesParsed,
				'Plan ville (Lausanne)',
				'fonds_geo_osm_bdcad_couleur',
				(defaultBaseLayer === 'fonds_geo_osm_bdcad_couleur'),
				));
				return arrWmtsLayers;
		} catch (err) {
				const message = `###!### ERROR in getWmtsBaseLayers occured with url:${url}: error is: ${err}`;
				console.warn(message);
				return [];
		}
}


async function createLausanneMap (
divOfMap = 'map',
centerOfMap = lausanneGareinMN95,
zoomLevel = 5,
baseLayer = defaultBaseLayer) {
		const arrBaseLayers = await getWmtsBaseLayers(urlLausanneMN95);
		if ((arrBaseLayers === null) || (arrBaseLayers.length < 1)) {
				console.warn('arrBaseLayers cannot be null or empty to be able to see a nice map !');
		}
		const map = new OlMap({
				target: divOfMap,
				layers: arrBaseLayers,
				view: new OlView({
						projection: swissProjection,
						center: centerOfMap,
						zoom: zoomLevel,
				}),
		});
		setBaseLayer(map, baseLayer);
		return map;
}

(async () => {
		const placeStFrancoisM95 = [2538202, 1152364];
		const myOlMap = await createLausanneMap('map', placeStFrancoisM95, 8, 'fonds_geo_osm_bdcad_couleur');
		console.log("myOlMap contains a ref to your OpenLayers Map Object : ", myOlMap)
		/*
		const urlSWISSTOPO = 'https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml?lang=fr';
		const WMTSCapabilitiesSWISSTOPO = await getWMTSCapabilitiesFromUrl(urlSWISSTOPO);
		const WMTSCapabilitiesParsedSWISSTOPO = parser.read(WMTSCapabilitiesSWISSTOPO);
		const olTileLayer = createBaseOlLayerTile(WMTSCapabilitiesParsedSWISSTOPO,
		'SwissImage 2020 10cm (SWISSTOPO)',
		'ch.swisstopo.swissimage',
		true,
		)
		myOlMap.addLayer(olTileLayer);
		
		 */
		
})();
