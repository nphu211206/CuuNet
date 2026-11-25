// Primary level-7 protocol: level 5 combined a broad central coastal region.
// Default creates the complete 2000-2024 batch. Run the 2024 task first to check geometry.
// CuuNet HYDRO-D-26-00188: paste into the authenticated Earth Engine Code Editor.
// Exports provider data independently of EWDS/MARS and independently of Kaggle.
// Configure a registered non-commercial Earth Engine project in the Code Editor.
// Export tasks require clicking Run; the script does not publish any data.

var CONFIG = {
  frequency: 'daily',                 // 'daily' primary; 'monthly' optional check
  start: '2000-01-01',
  endExclusive: '2025-01-01',
  exportFolder: 'CuuNet_HYDRO_revision',
  createAnnualTasks: true,            // start with 2024 for the acquisition check
  years: ee.List.sequence(2000, 2024),                     // after that check: ee.List.sequence(2000, 2024)
  basinCollection: 'WWF/HydroSHEDS/v1/Basins/hybas_7'
};
var SITES = [
  {zone: 'Bao_Ha_Runoff', name: 'Bao Ha regional sub-basin', lon: 104.47, lat: 22.26},
  {zone: 'Gianh_Runoff', name: 'Gianh regional sub-basin', lon: 106.43, lat: 17.70},
  {zone: 'Can_Tho_Runoff', name: 'Can Tho regional sub-basin', lon: 105.78, lat: 10.03}
];
var COLLECTION = CONFIG.frequency === 'daily'
  ? 'ECMWF/ERA5_LAND/DAILY_AGGR' : 'ECMWF/ERA5_LAND/MONTHLY_AGGR';
var SOURCE_BANDS = ['runoff_sum', 'total_precipitation_sum',
                    'temperature_2m', 'volumetric_soil_water_layer_1'];
var OUTPUT_BANDS = ['runoff_m', 'precipitation_m', 'temperature_K', 'soil_m3m3'];
var provider = ee.ImageCollection(COLLECTION)
  .filterDate(CONFIG.start, CONFIG.endExclusive).sort('system:time_start');
var projection = ee.Image(provider.first()).select('runoff_sum').projection();
var allBasins = ee.FeatureCollection(CONFIG.basinCollection);
var basins = ee.FeatureCollection(SITES.map(function(site) {
  // Select an enclosing sub-basin by a fixed coordinate and stable HYBAS_ID order.
  // This is local runoff generation; it is not upstream-routed river discharge.
  var point = ee.Geometry.Point([site.lon, site.lat]);
  var enclosing = allBasins.filterBounds(point).sort('HYBAS_ID');
  print('Enclosing basin count: ' + site.zone, enclosing.size());
  return ee.Feature(enclosing.first()).set({zone: site.zone, label: site.name,
    centre_lon: site.lon, centre_lat: site.lat,
    geometry_rule: 'enclosing_HydroBASINS_level7_stable_HYBAS_ID_order'});
}));

function imageRows(item) {
  var image = ee.Image(item);
  var values = image.select(SOURCE_BANDS, OUTPUT_BANDS).toDouble();
  var valid = values.mask().reduce(ee.Reducer.min());
  var area = ee.Image.pixelArea().updateMask(valid).rename('valid_area_m2');
  var weighted = values.multiply(area).addBands(area);
  return weighted.reduceRegions({collection: basins, reducer: ee.Reducer.sum(),
      crs: projection, tileScale: 4})
    .map(function(feature) {
      var support = ee.Number(feature.get('valid_area_m2'));
      var result = ee.Feature(null, feature.toDictionary(['zone', 'label', 'HYBAS_ID',
        'centre_lon', 'centre_lat', 'geometry_rule', 'valid_area_m2']));
      OUTPUT_BANDS.forEach(function(band) {
        result = result.set(band, ee.Number(feature.get(band)).divide(support));
      });
      return result.set({date: image.date().format('YYYY-MM-dd'),
        source_image: image.get('system:index'), source_id: COLLECTION,
        frequency: CONFIG.frequency, nominal_scale_m: projection.nominalScale(),
        accumulation: CONFIG.frequency === 'daily' ? 'daily_sum' : 'calendar_month_sum',
        aggregation: 'valid_land_pixel_area_weighted_mean',
        request_start: CONFIG.start, request_end_exclusive: CONFIG.endExclusive});
    });
}
function exportPeriod(start, endExclusive, description) {
  var collection = provider.filterDate(start, endExclusive);
  var rows = ee.FeatureCollection(collection.toList(collection.size()).map(imageRows)).flatten();
  print(description + ' image count', collection.size());
  print(description + ' first rows', rows.limit(6));
  Export.table.toDrive({collection: rows, description: description,
    folder: CONFIG.exportFolder, fileNamePrefix: description, fileFormat: 'CSV',
    selectors: ['date', 'zone', 'HYBAS_ID', 'runoff_m', 'precipitation_m',
      'temperature_K', 'soil_m3m3', 'valid_area_m2', 'centre_lon', 'centre_lat',
      'source_image', 'source_id', 'frequency', 'nominal_scale_m', 'accumulation',
      'aggregation', 'geometry_rule', 'request_start', 'request_end_exclusive']});
}

print('Provider image count; verify dates and bands before export', provider.size());
print('Provider first image', provider.first());
print('Native projection', projection);
print('Selected basin metadata', basins);
Map.addLayer(basins, {}, 'Fixed regional sub-basins');
Map.centerObject(basins, 5);
Export.table.toDrive({collection: basins, description: 'CuuNet_ERA5Land_L7_basins',
  folder: CONFIG.exportFolder, fileFormat: 'GeoJSON'});
if (CONFIG.createAnnualTasks) {
  ee.List(CONFIG.years).evaluate(function(years) {
    years.forEach(function(year) {
      exportPeriod(ee.Date.fromYMD(year, 1, 1), ee.Date.fromYMD(year + 1, 1, 1),
                   'CuuNet_ERA5Land_L7_' + CONFIG.frequency + '_' + year);
    });
  });
} else {
  // Monthly 2000–2024: approximately 900 regional records in one table.
  exportPeriod(CONFIG.start, CONFIG.endExclusive, 'CuuNet_ERA5Land_L7_' + CONFIG.frequency + '_2000_2024');
}
