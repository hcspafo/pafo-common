/**
 * pafo-common-web-package - v0.1.0
 * 2017-07-28 12:04:26 GMT+0500
 */
 (function (angular) {'use strict';
    HousesCondition2Ctrl.$inject = ["$state", "MapData", "publicStatisticHousesCondition2Rest", "publicStatisticError", "MAP_COLORS", "publicStatisticNumeralCoherentText", "intanTerritorySelect", "intanPercent"];
    angular.module('pafo-common-web-package')
        .controller('publicStatisticHousesCondition2Ctrl', HousesCondition2Ctrl);

    /* @ngInject */
    function HousesCondition2Ctrl($state, MapData, publicStatisticHousesCondition2Rest,publicStatisticError,
        MAP_COLORS, publicStatisticNumeralCoherentText, intanTerritorySelect, intanPercent) {

        var vm = this,
            range = housesConditionRange(),
            selectedRegion;

        vm.numeralCoherentText = publicStatisticNumeralCoherentText;

        vm.pageTitle = $state.current.data.pageTitle;
        vm.breadcrumbs = $state.current.data.breadcrumbs;

        vm.date = new Date();

        vm.specifyRegion = function (region) {vm.specifiedRegion = region;};
        vm.selectRegion = selectRegion;

        vm.selectTerritory = selectTerritory;
        vm.clearTerritory = clearTerritory;

        var currentYear =(new Date()).getFullYear();
        vm.minYear = 1700;
        vm.maxYear = currentYear;

        vm.dateSliderOptions = {
          floor: 1700,
          ceil: currentYear,
          mergeRangeLabelsIfSame: true,
          showTicksValues: true,
          ticksArray:[1700,1750,1800,1850,1900,1950,2000,currentYear],
          selectionBarGradient: {
            from:'#0d6bef',
            to: '#0db9f0'
          },
          onEnd : queryRegionsData          
        };
        queryRegionsData();

        // Модель диапозонов легенды
        function housesConditionRange() {
            var ranges = [
                {begin: 0, end: 0.1999, color: MAP_COLORS.GREEN_COLOR},
                {begin: 0.2000, end: 0.4000, color: MAP_COLORS.YELLOW_COLOR},
                {begin: 0.4001, end: 0.5000, color: MAP_COLORS.ORANGE_COLOR},
                {begin: 0.5001, end: 1, color: MAP_COLORS.RED_COLOR}
            ];

            return {
                list: rangeList,
                color: rangeColor
            };

            function rangeList() {
                return ranges;
            }

            function rangeColor(value) {
                var color = MAP_COLORS.GRAY_COLOR;
                ranges.some(function(range){
                    if (value >= range.begin && value <= range.end){
                        color = range.color;
                        return true;
                    }
                });
                return color;
            }
        }

        // Запрос данных по регионам
        function queryRegionsData() {
            var params = {
                operationYearFrom: vm.minYear,
                operationYearTo: vm.maxYear
            };

            publicStatisticHousesCondition2Rest.getData(params)
                .then(displayRegionsData, publicStatisticError);
        }

        // Подсчет общего числа МКД
        function putMkdCount(data) {
            data.mkdCount = data.accidentCount + data.normalCount + data.slumCount;
        }

        // Отображение общих данных по всем регионам
        function displayRegionsData(data) {
            if (!data) {
                return;
            }

            vm.ranges = range.list();

            fillMap(data.housesTechnicalCondition2Stats);

            selectedRegion = null;

            vm.selectedTerritoryName = null;

            setTotalData(data);

            fillCharts(vm.totalData);
        }

        // Данные по всем регионам
        function setTotalData(data) {
            vm.totalData = {
                accidentCount: data.accidentCount,
                normalCount: data.normalCount,
                slumCount: data.slumCount,
                yearsStat: data.yearsStat
            };

            putMkdCount(vm.totalData);
        }

        // Заполнение карты
        function fillMap(regionsData) {
            var regionsMapData;

            if (regionsData === null) {
                return;
            }

            regionsMapData = angular.copy(MapData);

            angular.forEach(regionsMapData, function (regionMapData) {
                regionsData.forEach(function (regionData) {
                    if (regionMapData.id !== String(regionData.regionCode)) {
                        return;
                    }

                    regionMapData.mainValue = regionData.averageWear;

                    regionMapData.accidentCount = regionData.accidentCount;
                    regionMapData.normalCount = regionData.normalCount;
                    regionMapData.slumCount = regionData.slumCount;
                    regionMapData.yearsStat = regionData.yearsStat;

                    regionMapData.regionAoGuid = regionData.regionAoguid;
                    regionMapData.regionOktmoCode = regionData.regionOktmoCode;

                    regionMapData.directControlMkdWear = regionData.directControlMkdWear;
                    regionMapData.managementOrganizationMkdWear = regionData.managementOrganizationMkdWear;
                    regionMapData.cooperativeMkdWear = regionData.cooperativeMkdWear;
                    regionMapData.noControlMkdWear = regionData.noControlMkdWear;
                    regionMapData.unpublishedMkdWear = regionData.unpublishedMkdWear;

                    putMkdCount(regionMapData);
                });
            });

            regionsMapData.forEach(function (region) {
                region.fill = range.color(region.mainValue);
            });

            vm.mapData = regionsMapData;
        }

        // Выбор региона на карте
        function selectRegion(regionMapData) {
            if (!regionMapData.mkdCount) {
                return;
            }

            selectedRegion = regionMapData;

            vm.selectedTerritoryName = selectedRegion.name;

            fillCharts(regionMapData);
        }

        // Выбор территории через форму
        function selectTerritory() {
            var params;

            if (selectedRegion) {
                params = {
                    regionAoGuid: selectedRegion.regionAoGuid,
                    regionOktmoCode: selectedRegion.regionOktmoCode
                };
            }

            intanTerritorySelect(params).then(queryTerritoryData);
        }

        function queryTerritoryData(territory) {
            var params = {
                operationYearFrom: vm.minYear,
                operationYearTo: vm.maxYear
            };

            if (territory.fias) {
                params.regionGuid = territory.fias.regionGuid;

                if (territory.fias.areaGuid) {
                    params.areaGuid = territory.fias.areaGuid;
                }
                if (territory.fias.cityGuid) {
                    params.cityGuid = territory.fias.cityGuid;
                }
                if (territory.fias.settlementGuid) {
                    params.placeGuid = territory.fias.settlementGuid;
                }
            }
            else if (territory.oktmo) {
                params.regionCode = territory.oktmo.regionCode;

                if (territory.oktmo.level3Code) {
                    params.mun1Code = territory.oktmo.level3Code;
                }
                if (territory.oktmo.level5Code) {
                    params.mun2Code = territory.oktmo.level5Code;
                }
                if (territory.oktmo.level7Code) {
                    params.placeCode = territory.oktmo.level7Code;
                }
            }
            else {
                return;
            }

            publicStatisticHousesCondition2Rest.getGraphicsData(params)
                .then(setTerritory, publicStatisticError);


            function setTerritory(graphicsData) {
                if (!graphicsData) {
                    return;
                }

                putMkdCount(graphicsData);

                fillCharts(graphicsData);

                vm.selectedTerritoryName = territory.formattedName;
            }
        }

        // Сброс территории, установка данных по всем регионам
        function clearTerritory() {
            if (vm.selectedTerritoryName) {
                return;
            }

            selectedRegion = null;

            fillCharts(vm.totalData);
        }

        // Заполнение графиков
        function fillCharts(data) {
            fillPieChart(data.mkdCount, data.normalCount, data.slumCount, data.accidentCount);

            fillBarChart(data.yearsStat);
        }

        // Заполнение круговой диаграммы
        function fillPieChart(totalMkd, normalCount, slumCount, accidentCount) {
            vm.barChartOptions = {};

            if (!totalMkd) {
                vm.pieChartData = null;
                return;
            }

            vm.pieChartData = {
                chart: [
                    {
                        label: 'Исправных',
                        value: normalCount,
                        color: '#2ca02c'
                    },
                    {
                        label: 'Ветхих',
                        value: slumCount,
                        color: '#ff7f0e'
                    },
                    {
                        label: 'Аварийных',
                        value: accidentCount,
                        color: '#d62728'
                    }
                ],
                summary: {
                    unit: 'МКД',
                    total: totalMkd,
                    message: 'Всего на выбранной\nтерритории',
                    messagePosition: 'top'
                }
            };
        }

        // Заполнение столбцовой диаграммы
        function fillBarChart(yearsStat) {
            vm.barChartOptions = {
                verticalBarLabel: true,
                legendMessage: 'Средний процент износа\nдомов за период'
            };

            if (!yearsStat) {
                vm.barChartData = null;
                return;
            }

            vm.barChartData = Object.keys(yearsStat).sort().map(function (year, i, years) {
                return {
                    label: year,
                    value: intanPercent(yearsStat[year]),
                    barColor: getBarColor(i, years.length, {r: 3, g: 170, b: 65}, {r: 143, g: 225,  b: 7}),
                    id: 'item' + i
                };
            });
        }

        // Градиентные цвета для столбцовой диаграммы
        function getBarColor(bar, barCount, fromColor, toColor) {
            var channels = ['r', 'g', 'b'],
                p = bar / barCount;

            return 'rgb(' + channels.map(getComponent).join(',') + ')';

            function getComponent(channel) {
                return Math.floor((1 - p) * fromColor[channel] + p * toColor[channel]);
            }
        }
    }
})(angular);

(function(angular) {'use strict';
    housesCondition2Rest.$inject = ["publicStatisticWidgetRestResource"];
    angular.module('pafo-common-web-package')
        .factory('publicStatisticHousesCondition2Rest', housesCondition2Rest);

    /* @ngInject */
    function housesCondition2Rest(publicStatisticWidgetRestResource) {
        var widget = createRestResources();

        return {
            getData: widget.housesCondition2.get,
            getGraphicsData: widget.housesCondition2graphics.get
        };

        function createRestResources() {
            return {
                housesCondition2: publicStatisticWidgetRestResource('/houses-condition-2' +
                    '?operationYearFrom=:operationYearFrom' +
                    '&operationYearTo=:operationYearTo'),

                housesCondition2graphics: publicStatisticWidgetRestResource('/houses-condition-2-graphics' +
                    '?regionGuid=:regionGuid' +
                    '&areaGuid=:areaGuid' +
                    '&cityGuid=:cityGuid' +
                    '&placeGuid=:placeGuid' +
                    '&regionCode=:regionCode' +
                    '&mun1Code=:mun1Code' +
                    '&mun2Code=:mun2Code' +
                    '&placeCode=:placeCode' +
                    '&operationYearFrom=:operationYearFrom' +
                    '&operationYearTo=:operationYearTo')
            };
        }
    }
})(angular);

(function (angular) {'use strict';
    HousesConditionCtrl.$inject = ["$state", "MapData", "intanHouseManagementTypes", "MAP_COLORS", "SearchResource", "publicStatisticError", "publicStatisticNumeralCoherentText", "intanPercent"];
    angular.module('pafo-common-web-package')
        .controller('publicStatisticHousesConditionCtrl', HousesConditionCtrl);

    /* @ngInject */
    function HousesConditionCtrl($state, MapData, intanHouseManagementTypes, MAP_COLORS,
        SearchResource, publicStatisticError, publicStatisticNumeralCoherentText, intanPercent) {
            var currentYear =(new Date()).getFullYear(),
            vm = this,
            NORMAL_CONDITION = {
                id: 'NORMAL_CONDITION',
                color: '#1eaf54',
                description: 'Исправные МКД',
                hint: 'МКД в исправном состоянии'
            },
            EMERGENCY_CONDITION = {
                id: 'EMERGENCY_CONDITION',
                color: '#fe285b',
                description: 'Аварийные МКД',
                hint: 'МКД в аварийном состоянии',
                info: 'Аварийным признается многоквартирный дом, по которому в Системе размещена информация о признании многоквартирного дома аварийным.'
            },
            UNKNOWN_CONDITION = {
                id: 'UNKNOWN_CONDITION',
                color: '#c2d5e0',
                description: 'Данные отсутствуют',
                hint: 'Данные отсутствуют',
                info: 'Многоквартирные дома, у которых в Системе отсутствует информация о состоянии'
            },
            housesConditionResource = new SearchResource('/widget/houses-condition'),
            getHousesCondition = function(params) {return housesConditionResource.queryPost({}, params);},
            range = getRange(),
            regionsData,
            selectedParams = {},
            selectedRegion = '';

        vm.pageTitle = $state.current.data.pageTitle;
        vm.breadcrumbs = $state.current.data.breadcrumbs;

        vm.yearSlider = {
            minYear: 1700,
            maxYear: currentYear,
            options: {
                floor: 1700,
                ceil: currentYear,
                mergeRangeLabelsIfSame: true,
                showTicksValues: true,

//showTicksValues: 50,
                ticksArray:[1700,1750,1800,1850,1900,1950,2000,currentYear],
                selectionBarGradient: {
                    from:'#0d6bef',
                    to: '#0db9f0'
                },
                onEnd : getData
            }
        };

        vm.houseManagementTypes = intanHouseManagementTypes().map(function (type) {type.id = type.code; return type;});
        vm.selectedHouseManagementTypes = vm.houseManagementTypes.slice();
        vm.selectedRegion = '';
        vm.getHouseManagementTypeHeader = getHouseManagementTypeHeader;

        vm.specifyRegion = function (region) {vm.specifiedRegion = region;};
        vm.selectRegion = selectRegion;

        vm.numeralCoherentText = publicStatisticNumeralCoherentText;

        vm.conditions = [NORMAL_CONDITION, EMERGENCY_CONDITION, UNKNOWN_CONDITION];
        vm.specifySector = function (sector) {vm.specifiedSector = sector;};
        vm.resetSpecifiedSector = function () {vm.specifiedSector = null;};
        vm.setBarChartDetails = function (details) {vm.barChartDetails = details;};

        vm.getData = getData;

        getData();

        function getData() {
            var params = {
                    constructionYearFrom: vm.yearSlider.minYear,
                    constructionYearTo: vm.yearSlider.maxYear,
                    needYearlessRecords: vm.yearSlider.options.floor === vm.yearSlider.minYear && vm.yearSlider.options.ceil === vm.yearSlider.maxYear,
                    houseManagementTypes: vm.selectedHouseManagementTypes.map(function (type) {return type.code;})
                };

            if (angular.equals(params, selectedParams) && selectedRegion === vm.selectedRegion) {
                return;
            }
            if (!angular.equals(params, selectedParams)) {
                angular.copy(params, selectedParams);
                // При указании этого параметра всегда вычисляется статистика для карты.
                // Статистика для диаграмм вычисляется зависит от параметра regionCode (см. ниже)
                params.needAllRegionStats = true;
            }
            selectedRegion = vm.selectedRegion;
            if (vm.selectedRegion) {
                params.regionCode = vm.selectedRegion;
            }

            getHousesCondition(params).then(setData, publicStatisticError);
        }

        function selectRegion(region) {
            vm.selectedRegion = region.id;
            getData();
        }

        function setData(data) {
            var regions,
                regionsByCode,
                regionsSortedByName;

            data = mapData(data);

            regionsData = data.regionStats;

            if (regionsData && regionsData.length) {
                regionsSortedByName = regionsData.sort(function(a,b) {
                    if (a.regionName < b.regionName) {
                        return -1;
                    } else if (a.regionName === b.regionName) {
                        return 0;
                    }
                    return 1;
                });
                regions = angular.copy(MapData);
                regionsByCode = regions.reduce(function(map, region) {map[region.id] = region; return map;}, {});
                regionsData.forEach(putRegionData);
                vm.regions = regions;
                vm.regionCodes = regionsSortedByName.map(function(region) {return region.regionCode;});
                vm.regionNames = regionsSortedByName.reduce(function(map, region) {map[region.regionCode] = region.regionName; return map;}, {});
                if (vm.regionNames.hasOwnProperty(selectedRegion)) {
                    vm.selectedRegion = selectedRegion;
                } else if (selectedRegion) {
                    // Если регион, указанный в фильтре, отсутствует в результатах запроса, то повторить запрос без фильтра по региону
                    vm.selectedRegion = '';
                    getData();
                }
                vm.unknownDeteriorationMkdCount = data.unknownDeteriorationMkdCount;
            }

            vm.date = data.dataReloadTime;
            vm.ranges = range.list();

            vm.houseManagementTypeList = vm.selectedHouseManagementTypes.length ?
                vm.selectedHouseManagementTypes : vm.houseManagementTypes;

            vm.totalMkd = data.yearStat.okMkdCount + data.yearStat.accidentMkdCount + data.yearStat.unknownConditionMkdCount;
            if (vm.totalMkd > 0) {
                vm.chartBagelData = {children: data.stats};
                vm.chartBagelLegend = data.stats.reduce(function(map, stat) {map[stat.id] = stat.value; return map;}, {});
            } else {
                vm.chartBagelData = null;
                vm.chartBagelLegend = null;
            }

            fillBarChart(data.yearsStat);

            function putRegionData(data) {
                var value = data.deteriorationPercent,
                    region;

                if (!value) {
                    return;
                }

                region = regionsByCode[data.regionCode];

                region.value = value;
                region.fill =  range.color(value);

                angular.extend(region, {
                    deteriorationPercent: data.deteriorationPercent,
                    percentsByManagementType: data.percentsByManagementType,
                    publishedMkdCount: data.publishedMkdCount,
                    unknownDeteriorationMkdCount: data.unknownDeteriorationMkdCount
                });
            }
        }

        function mapData(data) {
            data.stats = [
                angular.extend({
                    value: data.yearStat.okMkdPercent,
                    count: data.yearStat.okMkdCount
                }, NORMAL_CONDITION),
                angular.extend({
                    value: data.yearStat.accidentMkdPercent,
                    count: data.yearStat.accidentMkdCount
                }, EMERGENCY_CONDITION),
                angular.extend({
                    value: data.yearStat.unknownConditionMkdPercent,
                    count: data.yearStat.unknownConditionMkdCount
                }, UNKNOWN_CONDITION)
            ];
            data.yearsStat = data.yearStat.yearsStat;
            return data;
        }

        function getHouseManagementTypeHeader() {
            if (vm.selectedHouseManagementTypes.length === 0) {
                return 'Выберите способ управления';
            }
            else if (vm.selectedHouseManagementTypes.length === vm.houseManagementTypes.length) {
                return 'Все способы управления';
            }
            else if (vm.selectedHouseManagementTypes.length > 1){
                return 'Выбранные способы управления';
            }
            else {
                return vm.selectedHouseManagementTypes[0].name;
            }
        }

        function getRange() {
            var ranges = [
                {beginPrefix: 'до', end: 0.3099, displayEndCorrection: 0.0001, color: MAP_COLORS.GREEN_COLOR},
                {begin: 0.31, endPrefix: '\u2013', end: 0.37, color: MAP_COLORS.YELLOW_COLOR},
                {begin: 0.3701, endPrefix: '\u2013', end: 0.40, color: MAP_COLORS.ORANGE_COLOR},
                {beginPrefix: 'более', begin: 0.4001, displayBeginCorrection: -0.0001, color: MAP_COLORS.RED_COLOR}
            ];

            return {
                list: rangeList,
                color: rangeColor
            };

            function rangeList() {
                return ranges;
            }

            function rangeColor(value) {
                return ranges.filter(function(range) {
                    return (range.begin === undefined || value >= range.begin) &&
                        (range.end === undefined || value <= range.end);
                })[0].color;
            }
        }

        // Заполнение столбцовой диаграммы
        function fillBarChart(yearsStat) {
            vm.barChartOptions = {
                showBarLabel: false,
                verticalBarLabel: true,
                axes: {
                    x: {label: 'Год ввода в эксплуатацию'},
                    y: {label: 'Средний процент износа, %'}
                },
                selectionColor: '#fc6e59'
            };

            if (!yearsStat) {
                vm.barChartData = null;
                return;
            }

            var years = Object.keys(yearsStat);
            vm.barChartData = years.sort().map(function (year, i) {
                return {
                    label: year,
                    value: intanPercent(yearsStat[year]),
                    barColor: getBarColor(i, years.length, {r: 3, g: 170, b: 65}, {r: 143, g: 225,  b: 7}),
                    id: 'item' + i
                };
            });
        }

        // Градиентные цвета для столбцовой диаграммы
        function getBarColor(bar, barCount, fromColor, toColor) {
            var channels = ['r', 'g', 'b'],
                p = bar / barCount;

            return 'rgb(' + channels.map(getComponent).join(',') + ')';

            function getComponent(channel) {
                return Math.floor((1 - p) * fromColor[channel] + p * toColor[channel]);
            }
        }
    }
})(angular);

(function() {

    //TODO переименовать имя модуля (приставку "submodule.directive" под стиль системы)
    // Само имя модуля ни на что не влияет, но его НЕОБХОДИМО включать в модуль, где объявляется
    // контроллер страницы (не путать с контроллером приложения)
    var module = angular.module('pafo-common-web-package.main-forms');


    var directiveName = 'hcsFollowingTooltip';
    var templateHolderDirectiveName = '_' + directiveName;

    module.directive(templateHolderDirectiveName, function() {
        // директива просто для хранения шаблона
        return {
            restrict: 'A',
            templateUrl: 'main-forms/ef-rosstat/ef-rosstat-following-tooltip.tpl.html'
        };
    });

    module.directive(directiveName, [
        '$templateCache',
        '$injector',
        '$http',
        '$document',
        '$compile',
        '$sce',

        function(
            $templateCache,
            $injector,
            $http,
            $document,
            $compile,
            $sce) {

            function getAttrValue(attrs, attrName) {
                // get as attribute (@)
                return attrs[attrName];
            }

            function getExprValue($scope, attrValue) {
                // get as expression (&)
                return $scope.$eval(attrValue);
            }

            function processTemplate($scope, elem, attrs, form, template) {
                elem.bind('mousemove', function(evt) {
                    //$scope[directiveName].hover = true;
                    $scope[directiveName].top = evt.pageY + $scope[directiveName].marginTop;
                    $scope[directiveName].left = evt.pageX + $scope[directiveName].marginLeft;
                    $scope.$digest();
                });
                elem.bind('mouseover', function(evt) {
                    $scope[directiveName].hover = true;
                    $scope.$digest();
                });
                elem.bind('mouseout', function(evt) {
                    $scope[directiveName].hover = false;
                    $scope.$digest();
                });

                var templateElement = angular.element(template);
                $scope[directiveName].tooltipElement = $compile(templateElement)($scope, function(clonedElement, scope) {
                    var body = $document.children('html').children('body');
                    body.append(clonedElement);
                });
            }

            function cleanup($scope) {
                if ($scope && $scope[directiveName] && $scope[directiveName].tooltipElement) {
                    // $scope[directiveName].tooltipElement.detach();
                    $scope[directiveName].tooltipElement.remove();
                }
            }

            var ltRE = new RegExp('&lt;', 'g');
            var gtRE = new RegExp('&gt;', 'g');

            var defaultValues = {
                html: '',
                top: 0,
                left: 0,
                marginTop: 30,
                marginLeft: -20,
                display: true,
                hover: false,
                width: 'auto',
                height: 'auto'
            };

            return {
                scope: true,
                restrict: 'A',
                link: function($scope, elem, attrs, form) {
                    var values = angular.copy(defaultValues);

                    function processValues(directiveStrValue) {
                        var directiveValue;
                        try {
                            directiveValue = getExprValue($scope, directiveStrValue);
                        } catch (e) {
                            //console.error(e);
                            // use as attribute (@) value
                            directiveValue = directiveStrValue;
                        }
                        if (directiveValue !== undefined) {
                            // нет ошибки парсинга значения параметра как expression object/string
                            if (typeof directiveValue == 'string') {
                                // можно передавать не строку, а объект!
                                // значения по умолчанию в defaultValues
                                directiveValue = {
                                    html: directiveValue
                                };
                            }

                            values = angular.extend(values, directiveValue);

                            // TODO: unwrap tags if needed - убрать, если
                            // не работаем как с HTML сущностями, а сразу с чистым HTML
                            values.html = values.html.replace(ltRE, '<').replace(gtRE, '>');
                            values.html = $sce.trustAsHtml(values.html);

                            return directiveValue;
                        }
                    }

                    // отслеживаем смену аттрибута (типа $watch)
                    attrs.$observe(directiveName, function(directiveStrValue) {
                        var directiveValue = processValues(getAttrValue(attrs, directiveName));
                    });

                    $scope.$on('$destroy', function() {
                        cleanup($scope);
                    });

                    var directiveValue = processValues(getAttrValue(attrs, directiveName));
                    if (directiveValue !== undefined) {
                        $scope[directiveName] = values;

                        var templateUrl = $injector.get(templateHolderDirectiveName + 'Directive')[0].templateUrl;

                        var template = $templateCache.get(templateUrl);
                        if (!template) {
                            // load template if not already loaded
                            $http.get(templateUrl, {
                                cache: $templateCache
                            }).then(function(response) {
                                    template = response.data;
                                    processTemplate($scope, elem, attrs, form, template);
                                });
                        } else {
                            processTemplate($scope, elem, attrs, form, template);
                        }
                    }
                }
            };
        }
    ]);

})();

///**
// * Аналитика по данным Росстата Субсидии и льготы по оплате ЖКУ
// */
(function() {
    var module = angular.module('pafo-common-web-package.main-forms');

    module.controller('GrantsCtrl',
        [
            '$scope','$state',
            function($scope,$state) {
                $scope.pageTitle = $state.current.data.pageTitle;
                $scope.breadcrumbs = $state.current.data.breadcrumbs;


                var NEWS_CAROUSEL_INTERVAL =  12000;
                $scope.newsCarouselInterval = NEWS_CAROUSEL_INTERVAL;
            }
        ]);
})();

///**
// * Аналитика по данным Росстата Состояние жилого фонда
// */
(function () {
    var module = angular.module('pafo-common-web-package.main-forms');

    module.controller('HousingStockCtrl',
        [
            '$scope', '$state',
            function ($scope, $state) {
                $scope.pageTitle = $state.current.data.pageTitle;
                $scope.breadcrumbs = $state.current.data.breadcrumbs;


                var NEWS_CAROUSEL_INTERVAL =  12000;
                $scope.newsCarouselInterval = NEWS_CAROUSEL_INTERVAL;
            }
        ]);
})();

///**
// * Аналитика по данным Росстата Состояние коммунальной инфраструктуры.
// */
(function() {
    var module = angular.module('pafo-common-web-package.main-forms');

    module.controller('MunicipalInfrastructureCtrl',
        [
            '$scope','$state',
            function($scope,$state) {
                $scope.pageTitle = $state.current.data.pageTitle;
                $scope.breadcrumbs = $state.current.data.breadcrumbs;

                var NEWS_CAROUSEL_INTERVAL =  12000;
                $scope.newsCarouselInterval = NEWS_CAROUSEL_INTERVAL;
            }
        ]);
})();

(function(){
    var module = angular.module('pafo-common-web-package.main-forms');

    module.factory('Map', function () {
        var map = {};

        var R = null;

        function addTip(node, regionStatistic, onEnteredRegion, onLeftRegion, onClickRegion) {
            $(node).mouseenter(function () {
                onEnteredRegion(regionStatistic);

            }).mouseleave(function () {
                onLeftRegion(regionStatistic);
            }).click(function () {
                onClickRegion(regionStatistic);
            });
        }

        function drawing(regionStatistic, onEnteredRegion, onLeftRegion, onClickRegion) {
            var newPath = R.path('"' + regionStatistic.path + '"').attr('fill', regionStatistic.fill).attr('stroke', 'none');
            newPath.node.id = regionStatistic.id;
            newPath.node.style.cursor = "pointer";

            addTip(newPath.node, regionStatistic, onEnteredRegion, onLeftRegion, onClickRegion);
        }

        map.draw = function (mapData, size, onEnteredRegion, onLeftRegion, onClickRegion) {
            if (R != null) {
                R.remove();
            }

            if (angular.element('#mainMap').length > 0) {
                R = new Raphael("mainMap", size.width, size.height);
                try {
                    R.setViewBox(0, 0, 620, 420, true);
                } catch (e) {
                }

                angular.forEach(mapData, function (value, key) {
                    drawing(value, onEnteredRegion, onLeftRegion, onClickRegion);
                });
            }
        };

        return map;
    });
})();

(function () {
    var module = angular.module('pafo-common-web-package.main-forms');

    module.service("choseMapRegDirectionDialog", [
        '$modal',
        '_',

        function ($modal,
                  _) {

            var modalDefaults = {
                backdrop: true,
                keyboard: true,
                modalFade: true,
                referenceName : 'Выберите действие',
                size: 'lg',
                templateUrl: 'main-forms/map/ef_poch_mapReg_vr.tpl.html'
            };

            this.show = function () {
                modalDefaults.controller = function ($scope, $modalInstance) {


                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };

                    $scope.selectOrganisation = function () {
                        $modalInstance.close("organisation");
                    };

                    $scope.selectHome = function () {
                        $modalInstance.close("home");
                    };

                };

                return $modal.open(modalDefaults).result;

            };
        }
    ]);
})();

angular.module("pafo-common-web-package.main-forms")
    .filter("organizationFilter", function () {
        function decOfNum(number, titles, nonumber) {
            cases = [2, 0, 1, 1, 1, 2];
            return (nonumber?'':('' + number + ' ')) + titles[ (number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
        }

        var ORG_FILTER_COLLECTION = [
            ['организацией', 'организациями', 'организациями'],
            ['организация', 'организации', 'организаций']
        ];

        var ROLE_FILTER_COLLECTION = [
            ['функция', 'функции', 'функций'],
            ['функция', 'функции', 'функций']
        ];

        return function (numberOgOrgs, orgText, isShortForm, nonumber) {
            //HCS-20281
            if (numberOgOrgs === undefined) {
                numberOgOrgs = 0;
            }
            return orgText?decOfNum(numberOgOrgs, (isShortForm)?ORG_FILTER_COLLECTION[0]:ORG_FILTER_COLLECTION[1], nonumber):decOfNum(numberOgOrgs, (isShortForm)?ROLE_FILTER_COLLECTION[0]:ROLE_FILTER_COLLECTION[1], nonumber);
        };
    })
    .filter("houseAndOrganizationFilter", function () {
        function decOfNum(number, titles, isBreak) {
            cases = [2, 0, 1, 1, 1, 2];
            var result = titles[ (number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];

            return isBreak?result.replace(' ', '<br/>'): result;
        }

        var ORG_FILTER_COLLECTION =  ['зарегистрированная организация', 'зарегистрированные организации', 'зарегистрированных организаций'];

        var HOUSE_MKD_FILTER_COLLECTION = ['многоквартирный дом', 'многоквартирных дома', 'многоквартирных домов'];

        var HOUSE_JD_FILTER_COLLECTION = ['жилой дом', 'жилых дома', 'жилых домов'];

        return function (numberOgOrgs, isOrg, isMKD, lineBreak) {
            //HCS-20281
            if (numberOgOrgs === undefined) {
                numberOgOrgs = 0;
            }
            return isOrg?decOfNum(numberOgOrgs, ORG_FILTER_COLLECTION, lineBreak):decOfNum(numberOgOrgs, isMKD?HOUSE_MKD_FILTER_COLLECTION:HOUSE_JD_FILTER_COLLECTION, lineBreak);
        };
    })
    .controller("MapWithStaticsCtrl", ['$log', '$scope', '$state', '$filter', 'Map', '$PublicStatisticService', 'MapData', 'DEFAULT_PAGE_SIZE',
        'commonDialogs', '$document', '$NsiPpaService', '$stateParams', '$FiasService', '$timeout', 'choseMapRegDirectionDialog', 'MAP_COLORS', '$q',
        function ($log, $scope, $state, $filter, Map, $PublicStatisticService, MapData, defaultPageSize, commonDialogs, $document,
                  $NsiPpaService, $stateParams, $FiasService, $timeout, choseMapRegDirectionDialog, MAP_COLORS, $q) {

            var MANAGEMENT_ORGANIZATION = {
                code: "1"
            };

            var EXECUTIVE_AUTHORITY_IN_CHARGE_OF_MUNICIPAL_RESIDENTIAL_CONTROL = {
                code: "5"
            };
            var REGIONAL_GOV_AUTHORITY = {
                code: "7"
            };
            var LOCAL_GOVERNMENT_AUTHORITY = {
                code: "8"
            };

            //var APPROVED_ORG_ROLES_CODES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '14', '15', '16', '17'];
            //var APPROVED_ORG_ROLES_CODES = [MANAGEMENT_ORGANIZATION.code, '2', '4', EXECUTIVE_AUTHORITY_IN_CHARGE_OF_MUNICIPAL_RESIDENTIAL_CONTROL.code, REGIONAL_GOV_AUTHORITY.code, LOCAL_GOVERNMENT_AUTHORITY.code, '9', '10', '12',*/ /*HCS-30223, HCSINT-17560 '14',*/ '16'/*,HCSINT-17560 '18'*/];
            // В по ЧТЗ список должен содержать роли с кодами '14', '18'. Возвращаю эти роли, если будет заведен баг, то верну как было
            // Добавил EXECUTIVE_AUTHORITY_IN_CHARGE_OF_MUNICIPAL_RESIDENTIAL_CONTROL.code
            var APPROVED_ORG_ROLES_CODES = [MANAGEMENT_ORGANIZATION.code, '2', '4', EXECUTIVE_AUTHORITY_IN_CHARGE_OF_MUNICIPAL_RESIDENTIAL_CONTROL.code, REGIONAL_GOV_AUTHORITY.code, LOCAL_GOVERNMENT_AUTHORITY.code, '9', '10', '12', '14', '16', '18'];

            //Коды управляющей организации
            var UO_ORG_ROLES_CODES = ['4', REGIONAL_GOV_AUTHORITY.code, '10', '12', '16'];

            //Коды для подчиненного списка:Управляющая организация / ТСЖ / ЖК, ЖСК и иной кооператив
            var MANAGEMENT_ORGANIZATION_SUBMENU_CODES = ['101','102','103'];
            /*Фильтр по определенным полномочиям из ЧТЗ:
             «Оператор ГИС ЖКХ»;
             «Федеральный орган исполнительной власти в области государственного регулирования тарифов»;
             «Специализированная некоммерческая организация (региональный оператор капитального ремонта)» (HCS-20294, правка чтз HCS-21254);
             «Фонд содействия реформированию жилищно-коммунального хозяйства»;
             «Минстрой»
             */
            var FILTER_FEDERAL_ORG_ROLES_CODES = ['3', '6', /*'14',*/ '15', '17'];

            var MAIN_ORG_ROLES_CODES = [MANAGEMENT_ORGANIZATION.code,'2', '9','14','18'];

            var MOSKOW_REGION_CODE = "77";

            /*Код региона, содержащего данные по полномочиям федерального уровня:
             «Оператор ГИС ЖКХ»;
             «Федеральный орган исполнительной власти в области государственного регулирования тарифов»;
             «Фонд содействия реформированию жилищно-коммунального хозяйства»;
             «Минстрой»*/
            var FEDERAL_REGION_CODE = "0";

            //HCS-26916 если план меньше факта, то план приравнивается к факту.
            $scope.limitProcent = !$stateParams.isLimitProcent;
            $scope.federalRegionDefault = {
                real: 0,
                plan: 0,
                realOrgCount: 0,
                percantage: 0,
                orgCountByRole: {}
            };

            $scope.federalRegion = angular.copy($scope.federalRegionDefault);

            function federalRegionClear() {
                $scope.federalRegion = angular.copy($scope.federalRegionDefault);
            }

            $scope.pageTitle = $state.current.data.pageTitle;
            $scope.breadcrumbs = $state.current.data.breadcrumbs;

            $scope.expandedFilter = true;

            $scope.mapData = angular.copy(MapData).filter(function (a) {return a.id!='99';});
            $scope.sortedField = 'percentage';
            $scope.sortedDirect = 'desc';

            $scope.model = {};
            $scope.model.organizationFilter = [];
            $scope.model.enableOrgFilter = true;
            $scope.model.managementOrgUK = true;
            $scope.model.managementOrgTSJ = true;
            $scope.model.managementOrgJK = true;
            $scope.model.enableManagementHouseTypeFilter = false;
            $scope.model.managementHouseByDirectControl = true;
            $scope.model.managementHouseByManagementOrganization = true;
            $scope.model.managementHouseByManagementCooperative = true;
            $scope.model.managementHouseByAnotherWay = true;
            $scope.model.managementHouseByUnknown = true;
            $scope.model.managementHouseJD = false;
            this.$modelValue = [];
            $scope.getEnableApartmentHouseStatics = function() {
                return ($scope.model.managementHouseByDirectControl ||
                    $scope.model.managementHouseByManagementOrganization ||
                    $scope.model.managementHouseByManagementCooperative ||
                    $scope.model.managementHouseByAnotherWay ||
                    $scope.model.managementHouseByUnknown) &&
                    $scope.model.enableManagementHouseTypeFilter;
            };

            $scope.msgX = 0;
            $scope.msgY = 0;
            $scope.currentRegionStatistic = null;
            $scope.numberOfRealOrganizations = 0;
            $scope.numberOfPlanOrganizations = 0;
            $scope.percentageOfRealOrganizations = 0;
            $scope.numberOfManagementHouse = 0;
            $scope.planOfManagementHouse = 0;
            $scope.numberOfJDHouse = 0;

            $scope.visibleMessage = false;

            $scope.organizationMap = {};
            $scope.organizationRoles=null;

            $scope.totalOrgCountInSystem = 0;
            $scope.totalMKDCountInSystem = 0;
            $scope.totalJDCountInSystem = 0;

            $scope.openedOrganizationRolePopup = false;
            $scope.organizationRolePopupTrigger = function() {
                $scope.openedOrganizationRolePopup = !$scope.openedOrganizationRolePopup;
            };

            function findOrganizationRole() {
                var deferred = $q.defer();
                $NsiPpaService.findOrganizationRole({}, function(response) {
                    $scope.organizationRoles = _.sortBy(response, function(r) {return parseInt(r.code, 10);});
                    _.remove($scope.organizationRoles, function(r) {
                        return !_.contains(APPROVED_ORG_ROLES_CODES, r.code);
                    });
                    angular.forEach($scope.organizationRoles, function (value) {
                        if(value.code === MANAGEMENT_ORGANIZATION.code) {
                            value.items = [
                                {id: "101", code: "101", organizationRoleName: 'Управляющая организация', name: 'Управляющая организация'},
                                {id: "102", code: "102", organizationRoleName: 'ТСЖ', name: 'ТСЖ'},
                                {id: "103", code: "103", organizationRoleName: 'ЖК, ЖСК и иной кооператив', name: 'ЖК, ЖСК и иной кооператив'}
                            ];
                            value.organizationRoleName = "Организация, осуществляющая управление МКД";
                            $scope.model.organizationFilter = angular.copy(value.items);
                            $scope.model.organizationFilter.push(angular.copy(value));
                        }
                    });
                    angular.forEach($scope.organizationRoles, function (value) {
                        $scope.organizationMap[value.code] = value.organizationRoleName;
                        value.id = value.code;
                        value.name = value.organizationRoleName;

                    });
                    _.remove($scope.organizationRoles, function(r) {
                        //HCSANALYST-595 выбор всех ОГВ в агрегированном виде, надпись взять из роли 7 «Органы государственной власти субъекта РФ»
                        return _.contains(UO_ORG_ROLES_CODES, r.code) && r.code != REGIONAL_GOV_AUTHORITY.code;
                    });
                    _.remove($scope.organizationRoles, function(r) {
                        //HCSANALYST-670 необходимо скрыть "Орган местного самоуправления, осуществляющий муниципальный жилищный контроль"
                        return r.code === EXECUTIVE_AUTHORITY_IN_CHARGE_OF_MUNICIPAL_RESIDENTIAL_CONTROL.code;
                    });
                    deferred.resolve();
                });
                return deferred.promise;
            }

            $scope.managementHouses = [
                {id: 1, name: 'Непосредственное управление'},
                {id: 2, name: 'Управляющая организация'},
                {id: 3, name: 'ТСЖ, ЖСК, ЖК, иной кооператив'},
                {id: 4, name: 'Способ управления не выбран или не реализован'},
                {id: 5, name: 'Информация о способе управления не размещена в системе'}
            ];
            $scope.model.managementHouseSelected = [];

            function getSelectedItemsOfHouseFilter() {
                var txt = '';
                for (var i in $scope.model.managementHouseSelected) {
                    if(txt !== ''){
                        txt += ", ";
                    }
                    txt += $scope.model.managementHouseSelected[i].name;
                }
                return txt;
            }

            $scope.getApartmentHouseFilterText = function () {
                if ($scope.model.managementHouseSelected.length === 0) {
                    return 'Выберите способ управления';
                } else if ($scope.model.managementHouseSelected.length === $scope.managementHouses.length) {
                    return 'Все способы управления';
                } else if ($scope.model.managementHouseSelected.length > 1){
                    return 'Выбранные способы управления';
                } else {
                    return $scope.model.managementHouseSelected[0].name;
                }
            };

            //Всего организаций в системе
            $PublicStatisticService.getRegisteredOrganizationStatistics(
                {
                    isLimitProcent:$scope.limitProcent,
                    orgTypeCodes:["101", "102", "103", "2", "4", "7","10", "12", "16", "5", "8", "14", "18"]
                },
                function(result) {
                    $scope.totalOrgCountInSystem = result.totalOrgCount;
                },
                onError
            );

            $scope.pagination = {
                paginationConfig: {
                    itemsPerPage: 1000,
                    page: 1,
                    isLast: defaultPageSize >= $scope.mapData.length
                },
                modal: false,
                pageChanged: function (page) {
                    var paginationConfig = $scope.pagination.paginationConfig;
                    var maxPage = Math.ceil($scope.mapData.length / paginationConfig.itemsPerPage);

                    $scope.pagination.paginationConfig.page = paginationConfig.page > maxPage ? maxPage : paginationConfig.page;
                    $scope.pagination.paginationConfig.isLast = paginationConfig.page >= maxPage;

                    return {
                        then: function (cb) {
                            cb();
                        }
                    };
                }
            };

            $scope.initMap = function () {
                //sendRequestForRegisteredOrganizationStatistics();
                /*sendRequestForHousesByManagementTypeStatistics();*/
                drawMap();
            };

            $scope.isSelectFilteredOrganization = false;

            $scope.getOrganizationFilterText = function() {
                if (areSelectedAllRoles()) {
                    return 'Все виды организаций';
                } else if ($scope.model.organizationFilter.length === 0) {
                    return 'Выберите виды организации';
                } else if ($scope.model.organizationFilter.length > 1) {
                    return 'Выбранные виды организаций';
                } else {
                    return $scope.model.organizationFilter[0].organizationRoleName;
                }
            };

            /*$scope.getManagementTypeFilterText = function () {
             return "Типы управления";
             };*/

            $scope.dumpOfRogStatics = null;

            var lastRequestTime = null;
            $scope.changeOrgFilter = function(isMainCheckbox) {
                $scope.model.enableOrgFilter = isMainCheckbox?$scope.model.enableOrgFilter: $scope.model.organizationFilter && $scope.model.organizationFilter.length > 0;

                if(isMainCheckbox && $scope.model.enableOrgFilter){
                    angular.forEach($scope.organizationRoles, function (value) {
                        if(value.code === MANAGEMENT_ORGANIZATION.code) {
                            $scope.model.organizationFilter = angular.copy(value.items); // [angular.copy(value)]; HCS-45506
                        }
                    });
                    $scope.model.managementOrgUK = true;
                    $scope.model.managementOrgTSJ = true;
                    $scope.model.managementOrgJK = true;
                }

                if(!$scope.model.enableOrgFilter){
                    calculateHousesStatistics(houseStaticFromServer, planHouseStaticFromServer, regions);
                }
                var statisticsRequest = {};
                statisticsRequest.isLimitProcent = $scope.limitProcent;
                console.log("limitProcent: " + statisticsRequest.isLimitProcent);
                statisticsRequest.orgTypeCodes = [];

                if(!$scope.model.enableOrgFilter){
                    $scope.model.organizationFilter = [];
                }
                var isSelectFilteredOrganizationTemp = false;
                $scope.model.isSelectedFilter = [];
                for (var orgType in $scope.model.organizationFilter){
                    $scope.model.isSelectedFilter[$scope.model.organizationFilter[orgType].code]=true;
                    //HCS-24011 Если выбрано УО необходимо разделение на типы для роли
                    if(_.contains(MANAGEMENT_ORGANIZATION_SUBMENU_CODES, $scope.model.organizationFilter[orgType].code)){
                        $scope.model.isSelectedFilter['1'] = true;
                    }
                    if($scope.model.organizationFilter[orgType].code == REGIONAL_GOV_AUTHORITY.code){
                        statisticsRequest.orgTypeCodes = statisticsRequest.orgTypeCodes.concat(UO_ORG_ROLES_CODES);

                    } else if($scope.model.organizationFilter[orgType].code == LOCAL_GOVERNMENT_AUTHORITY.code){
                        //HCSANALYST-670 необходим запрос сразу по двум ролям
                        statisticsRequest.orgTypeCodes.push(EXECUTIVE_AUTHORITY_IN_CHARGE_OF_MUNICIPAL_RESIDENTIAL_CONTROL.code, LOCAL_GOVERNMENT_AUTHORITY.code);
                    } else {
                        statisticsRequest.orgTypeCodes.push($scope.model.organizationFilter[orgType].code);
                    }
                    if (!isSelectFilteredOrganizationTemp &&_.contains(FILTER_FEDERAL_ORG_ROLES_CODES, $scope.model.organizationFilter[orgType].code)) {
                        isSelectFilteredOrganizationTemp = true;
                    }
                }

                $scope.isSelectFilteredOrganization = isSelectFilteredOrganizationTemp;

                $log.info('*****************');

                var localRequestTime = new Date().getTime();
                lastRequestTime = localRequestTime;

                $PublicStatisticService.getRegisteredOrganizationStatistics(
                    statisticsRequest,
                    function(result) {
                        //Карта должна заполняться по последнему запросу
                        if(lastRequestTime && lastRequestTime === localRequestTime) {
                            $scope.dumpOfRogStatics = result;

                            $scope.calculateOrganizationStatistics();
                        }
                    },
                    onError
                );
            };


            $scope.changeManagementOrgTypeFilter = function () {
                $scope.changeOrgFilter();
            };

            $scope.changeManagementHouseTypeFilter = function (checkBox) {
                if(checkBox){
                    if($scope.model.enableManagementHouseTypeFilter){
                        $scope.model.managementHouseSelected = $scope.managementHouses;
                    } else {
                        $scope.model.managementHouseSelected = [];
                    }
                }

                if($scope.model.enableManagementHouseTypeFilter){
                    $scope.model.managementHouseByDirectControl = false;
                    $scope.model.managementHouseByManagementOrganization = false;
                    $scope.model.managementHouseByManagementCooperative = false;
                    $scope.model.managementHouseByAnotherWay = false;
                    $scope.model.managementHouseByUnknown = false;
                    for(var elem in $scope.model.managementHouseSelected){
                        if($scope.model.managementHouseSelected[elem].id === 1){
                            $scope.model.managementHouseByDirectControl = true;
                        }
                        if($scope.model.managementHouseSelected[elem].id === 2){
                            $scope.model.managementHouseByManagementOrganization = true;
                        }
                        if($scope.model.managementHouseSelected[elem].id === 3){
                            $scope.model.managementHouseByManagementCooperative = true;
                        }
                        if($scope.model.managementHouseSelected[elem].id === 4){
                            $scope.model.managementHouseByAnotherWay = true;
                        }
                        if($scope.model.managementHouseSelected[elem].id === 5){
                            $scope.model.managementHouseByUnknown = true;
                        }
                    }
                    if ($scope.model.managementHouseSelected.length === 0){
                        $scope.model.enableManagementHouseTypeFilter = false;
                    }
                }

                if (houseStaticFromServer && planHouseStaticFromServer) {
                    calculateHousesStatistics(houseStaticFromServer, planHouseStaticFromServer, regions);
                }
            };

            function drawMap() {
                $log.info('drawMap()');

                Map.draw($scope.mapData, getMapSize(), onEnteredRegion, onLeftRegion, $scope.onClickRegion);
            }

            function getMapSize() {
                var k = 1.7;
                var minWidth = 500;

                var width = $(".hcs-public-map-data-block")[0].clientWidth - 380;
                width = width > minWidth ? width : minWidth;

                size = {
                    height: Math.ceil(width / k),
                    width: width
                };

                return size;
            }

            $scope.mousemove = function (e) {
                if (e.currentTarget.id == 'tip') {
                    return;
                }

                var dirPosition = $(".registered-organization-statistics").offset();

                $("#tip").css("left", e.pageX - 283 - dirPosition.left);
                $("#tip").css("top", e.pageY  - $("#tip")[0].clientHeight + 83 - dirPosition.top);
            };

            $scope.currentDate = function () {
                return new Date();
            };

            $scope.getDataWithPagination = function () {
                var paginationConfig = $scope.pagination.paginationConfig;
                var start = (paginationConfig.page - 1) * paginationConfig.itemsPerPage;
                var end = paginationConfig.page * paginationConfig.itemsPerPage;
                return $scope.mapData.slice(start, end);
            };

			$scope.getSumData = function(field1, field2){
				var sum = 0;
				var data = $scope.mapData;
				for (var i=0; i <data.length ; i++ ){
					if(field2){
						if(data[i][field1] && data[i][field1][field2]){
							sum += data[i][field1][field2];
						}
					} else {
						sum += data[i][field1];
					}
				}
				return sum;
			};

            $scope.getOrgTotalPercentage = function(){
                var sumPlan = 0;
                var sumReal = 0;
                var data = $scope.mapData;
                for (var i=0; i <data.length ; i++ ){
                    if(data[i].plan && data[i].plan!==0){
                        sumPlan += data[i].plan;
                        sumReal += data[i].real;
                    }
                }
                return $scope.getSumDataPercentage(sumPlan,sumReal);
            };

            $scope.getSumDataPercentage = function(value1, value2){
                if(value1 === 0 || value2 === 0) {
                    return '-';
                }
                var sumPercentage = Math.round((value2/value1*100) * 100) / 100 !==0 ? Math.round((value2/value1*100) * 100) / 100 + '%' : '-';
                return sumPercentage.replace('.', ',');
            };

            $scope.getClassOfOrgPercentage = function (region) {
                var circleClass = '';

                if (region.percentage > 100 && !$scope.limitProcent) {
                    circleClass = 'ico lico6';
                } else if (region.percentage >= 75) {
                    circleClass = 'ico lico5';
                } else if (region.percentage >= 50) {
                    circleClass = 'ico lico4';
                } else if (region.percentage >= 25) {
                    circleClass = 'ico lico3';
                } else if (region.percentage > 0.0) {
                    circleClass = 'ico lico2';
                } else if ((!$scope.model.enableOrgFilter || $scope.model.enableOrgFilter && region.real === 0) &&
                    (!$scope.model.managementHouseJD||$scope.model.managementHouseJD && region.managementHouseTable && region.managementHouseTable[HOUSE_JD]===0)&&
                    (!$scope.getEnableApartmentHouseStatics() || $scope.getEnableApartmentHouseStatics() && region.managementHouseTable && region.managementHouseTable[HOUSE_MKD]===0)) {
                    circleClass = 'ico lico1';
                } else {
                    circleClass = 'ico lico0';
                }

                return circleClass;
            };

            function getColorOfOrgPercentage(region) {
                var color = '';

                if (region.percentage > 100 && !$scope.limitProcent) {
                    color = MAP_COLORS.VIOLET_COLOR;
                } else if (region.percentage >= 75) {
                    color = MAP_COLORS.GREEN_COLOR;
                } else if (region.percentage >= 50) {
                    color = MAP_COLORS.YELLOW_COLOR;
                } else if (region.percentage >= 25) {
                    color = MAP_COLORS.ORANGE_COLOR;
                } else if (region.percentage > 0.0) {
                    color = MAP_COLORS.RED_COLOR;
                } else if ((!$scope.model.enableOrgFilter || $scope.model.enableOrgFilter && region.real === 0) &&
                    (!$scope.model.managementHouseJD||$scope.model.managementHouseJD && region.managementHouseTable[HOUSE_JD]===0)&&
                    (!$scope.getEnableApartmentHouseStatics() || $scope.getEnableApartmentHouseStatics() && region.managementHouseTable[HOUSE_MKD]===0)) {
                    color = MAP_COLORS.GREY_COLOR;
                } else {
                    color = MAP_COLORS.BLUE_COLOR;
                }

                return color;
            }

            $scope.formatPercentage = function (value) {
                var num = Number(value).toFixed(2);
                var r = '' + (((num>100)&&($scope.limitProcent))?100:num);
                return r.replace('.', ',');
            };

            $scope.getStaticByRegionInCloud = function(regionStatistic,isShortForm, roleText) {
                if (regionStatistic == null) {
                    return '';
                }

                var strStatic = $filter('organizationFilter')(roleText?regionStatistic.real:regionStatistic.realOrgCount, !roleText, isShortForm);

                return strStatic;
            };

            $scope.getStaticByRoleInCloud = function(regionStatistic) {
                if (regionStatistic == null) {
                    return '';
                }

                var strStatic = $filter('organizationFilter')(regionStatistic.real, false, true);
                if (regionStatistic.plan > 0) {
                    strStatic += ' - ' + $scope.formatPercentage(regionStatistic.planOrgPercentage) + '%';
                }

                return strStatic;
            };

            $scope.childField = null;

            $scope.clickSort = function (field, childField) {
                if ($scope.sortedField != field) {
                    $scope.sortedField = field;
                    $scope.sortedDirect = field != 'percentage' ? 'asc' : 'desc';
                } else {
                    $scope.sortedDirect = $scope.sortedDirect == 'asc' ? 'desc' : 'asc';
                }

                $scope.childField = childField;



                sort();
            };

            function sort() {
                if ($scope.sortedField === '') {
                    return;
                }

                $scope.mapData.sort(function (a, b) {
                    if ($scope.sortedField == 'percentage' ) {
                        return sortPercentage (a, b, false);
                    } else if($scope.sortedField == 'planManagementHousePercent'|| $scope.sortedField == 'planOrgPercentage'){
                        return sortPercentage (a, b, true);
                    }


                    var n1 = !!$scope.childField?(a[$scope.sortedField][$scope.childField]):(a[$scope.sortedField]);
                    var n2 = !!$scope.childField?b[$scope.sortedField][$scope.childField]:b[$scope.sortedField];

                    if ($scope.sortedDirect == 'asc') {
                        return n1 - n2;
                    } else {
                        return n2 - n1;
                    }
                });

                initTable();
            }

            function sortPercentage (a, b, fromTable) {

                var r1 = {
                    real: 0,
                    plan: 0
                };
                var r2 = {
                    real: 0,
                    plan: 0
                };

                if($scope.model.enableOrgFilter && (!fromTable || (fromTable && !$scope.childField))){
                    r1.real += a.real;
                    r1.plan += a.plan;
                    r2.real += b.real;
                    r2.plan += b.plan;
                }
                if($scope.model.managementHouseJD && (!fromTable || (fromTable && $scope.childField == HOUSE_JD))){
                    r1.real += a.managementHouseTable[HOUSE_JD]?a.managementHouseTable[HOUSE_JD]:0;
                    r1.plan += a.planManagementHouseTable[HOUSE_JD]?a.planManagementHouseTable[HOUSE_JD]:0;
                    r2.real += b.managementHouseTable[HOUSE_JD]?b.managementHouseTable[HOUSE_JD]:0;
                    r2.plan += b.planManagementHouseTable[HOUSE_JD]?b.planManagementHouseTable[HOUSE_JD]:0;
                }
                if($scope.getEnableApartmentHouseStatics() && (!fromTable || (fromTable && $scope.childField == HOUSE_MKD))){
                    r1.real += a.managementHouseTable[HOUSE_MKD]?a.managementHouseTable[HOUSE_MKD]:0;
                    r1.plan += a.planManagementHouseTable[HOUSE_MKD]?a.planManagementHouseTable[HOUSE_MKD]:0;
                    r2.real += b.managementHouseTable[HOUSE_MKD]?b.managementHouseTable[HOUSE_MKD]:0;
                    r2.plan += b.planManagementHouseTable[HOUSE_MKD]?b.planManagementHouseTable[HOUSE_MKD]:0;
                }

                if($scope.model.managementHouseJD && (fromTable && $scope.childField == HOUSE_JD)){
                    var p1 = a.planManagementHousePercent[HOUSE_JD];
                    var p2 = b.planManagementHousePercent[HOUSE_JD];
                    return ($scope.sortedDirect == 'asc') ? (p1 - p2) : (p2 - p1);
                }
                if($scope.getEnableApartmentHouseStatics() && (fromTable && $scope.childField == HOUSE_MKD)){
                    var p3 = a.planManagementHousePercent[HOUSE_MKD];
                    var p4 = b.planManagementHousePercent[HOUSE_MKD];
                    return ($scope.sortedDirect == 'asc') ? (p3 - p4) : (p4 - p3);
                }
                if(fromTable && ($scope.sortedField == 'planOrgPercentage')){
                    var o1 = a.planOrgPercentage;
                    var o2 = b.planOrgPercentage;
                    return ($scope.sortedDirect == 'asc') ? (o1 - o2) : (o2 - o1);
                }


                if (r1.plan > 0 && r1.real === 0 && r2.plan > 0 && r2.real === 0) {
                    return 0;
                } else if (r1.plan > 0 && r1.real === 0) {
                    if (r2.plan === 0 && r2.real === 0) {
                        return $scope.sortedDirect == 'asc' ? 1 : -1;
                    } else {
                        return $scope.sortedDirect == 'asc' ? -1 : 1;
                    }
                } else if (r2.plan > 0 && r2.real === 0) {
                    if (r1.plan === 0 && r1.real === 0) {
                        return $scope.sortedDirect == 'asc' ? -1 : 1;
                    } else {
                        return $scope.sortedDirect == 'asc' ? 1 : -1;
                    }
                } else if (r1.plan === 0 && r2.plan === 0 && $scope.sortedDirect == 'asc') {
                    return r1.real == r2.real ? 0 : r1.real < r2.real ? -1 : 1;
                } else if (r1.plan === 0 && r2.plan === 0 && $scope.sortedDirect == 'desc') {
                    return r1.real == r2.real ? 0 : r1.real < r2.real ? 1 : -1;
                } else if ($scope.sortedDirect == 'asc') {
                    return a.percentage == b.percentage ? 0 : a.percentage < b.percentage ? -1 : 1;
                } else {
                    return -(a.percentage - b.percentage);
                }
            }

            var timer = null;

            function onEnteredRegion(regionStatistic) {
                $scope.currentRegionStatistic = regionStatistic;

                if (timer != null) {
                    clearTimeout(timer);
                    timer = null;
                } else {
                    $scope.visibleMessage = true;
                    $("#tip").fadeIn(200);
                }
            }

            function onLeftRegion(regionStatistic) {
                if (!$scope.visibleMessage) {
                    return;
                }

                timer = setTimeout(function () {
                    $scope.visibleMessage = false;
                    $("#tip").fadeOut(30);
                    timer = null;
                }, 100);
            }

            function goOrganizations (regionStatistic) {

                var orgRoleCodes = [];

                angular.forEach($scope.model.organizationFilter, function (role) {
                    if(role.code === '101'){
                        orgRoleCodes.push('1');
                    } else if(role.code === '102'){
                        orgRoleCodes.push('19');
                    } else if(role.code === '103'){
                        orgRoleCodes.push('20');
                        orgRoleCodes.push('21');
                        orgRoleCodes.push('22');
                    } else {
                        orgRoleCodes.push(role.code);
                    }
                });

                //HCS-27295
                //ОЧ: Карта регистрации: при переходе с карты в РО в поле "Вид" подставляются параметры некорректно
                if (orgRoleCodes && orgRoleCodes.length > 0) {
                    //Если передаем 8й код полномочия, добавляем еще и 5й
                    if (orgRoleCodes.indexOf(LOCAL_GOVERNMENT_AUTHORITY.code) != -1 && orgRoleCodes.indexOf(EXECUTIVE_AUTHORITY_IN_CHARGE_OF_MUNICIPAL_RESIDENTIAL_CONTROL.code) == -1) {
                        orgRoleCodes.push(EXECUTIVE_AUTHORITY_IN_CHARGE_OF_MUNICIPAL_RESIDENTIAL_CONTROL.code);
                    }

                    //Если передаем 7й код полномочия, добавляем еще и сагрегированные в нем коды операций
                    var indexOf7thRole = orgRoleCodes.indexOf(REGIONAL_GOV_AUTHORITY.code);
                    if (indexOf7thRole != -1) {
                        orgRoleCodes.splice(indexOf7thRole, 1);
                        orgRoleCodes = orgRoleCodes.concat(UO_ORG_ROLES_CODES);
                    }

                    //HCS-34525 ОЧ: Реестр поставщиков информации: при переходе с карты предается УО, если на карте не выбраны подполномочия.
                    //Если в качестве типа управления передан пустой список, то организации с полномочием «Управляющая организация» не отображаются.
                    if (!($scope.model.managementOrgUK || $scope.model.managementOrgTSJ || $scope.model.managementOrgJK)) {
                        var indexOfMORole = orgRoleCodes.indexOf(MANAGEMENT_ORGANIZATION.code);
                        if (indexOfMORole != -1) {
                            orgRoleCodes.splice(indexOfMORole, 1);
                        }
                    }
                }

                $state.go("organizations", {roleRegionCode: regionStatistic.regionCode, orgType: orgRoleCodes,
                    doSearch: true
                });
            }

            function goHomeManagement (regionStatistic) {
                var parameters = {};

                if (regions) {
                    var region = _.find (regions, {regionCode: regionStatistic.id});
                    parameters.regionAoGuid = region ? region.aoGuid : undefined;
                }

                parameters.houseTypesPrefilling = generateHouseTypesPrefilling();

                if ($scope.getEnableApartmentHouseStatics()) {
                    parameters.managementTypesPrefilling =  generateManagementTypesPrefilling();
                }

                $state.go("houses", parameters, { reload: true });
            }

            function generateHouseTypesPrefilling() {
                var houseTypes = [];
                if ($scope.getEnableApartmentHouseStatics()) {
                    houseTypes.push('1'); // Код многоквартиного дома
                }
                if ($scope.model.managementHouseJD) {
                    houseTypes.push('2'); // Код жилого дома
                    houseTypes.push('3'); // HCS-61597
                }

                return houseTypes.join();
            }

            function generateManagementTypesPrefilling() {
                var managementHouseTypes = [];

                if ($scope.model.managementHouseByDirectControl) {
                    managementHouseTypes.push('1'); // Код Непосредственного управления - '1'
                }
                if ($scope.model.managementHouseByManagementOrganization) {
                    managementHouseTypes.push('5'); // Код УО - '5'
                }
                if ($scope.model.managementHouseByManagementCooperative) {
                    managementHouseTypes.push('2'); // Код ТСЖ - '2'
                    managementHouseTypes.push('3'); // Код ЖСК - '3'
                    managementHouseTypes.push('4'); // Код Иной кооператив - '4'
                }
                if ($scope.model.managementHouseByAnotherWay) {
                    managementHouseTypes.push('6'); // Код 'Не выбран' - '6'
                }
                if ($scope.model.managementHouseByUnknown) {
                    managementHouseTypes.push('null'); // Код 'Информация о способе управления не размещена в системе' - 'null'
                }

                return managementHouseTypes.join();
            }

            $scope.onClickRegion = function(regionStatistic) {
                $log.info("On region click", regionStatistic);

                if ($scope.model.enableOrgFilter && ($scope.getEnableApartmentHouseStatics() || $scope.model.managementHouseJD)) {
                    choseMapRegDirectionDialog.show().then(function (result) {
                        if (result === "organisation") {
                            goOrganizations(regionStatistic);
                        } else if (result === "home") {
                            goHomeManagement(regionStatistic);
                        }
                        console.log("choseMapRegDirectionDialog.select", result);
                    }, function () {
                        console.log('choseMapRegDirectionDialog.cancel');
                    });
                } else if ($scope.model.enableOrgFilter) {
                    goOrganizations(regionStatistic);
                } else {
                    goHomeManagement(regionStatistic);
                }
            };

            function onError(error) {
                commonDialogs.error("Во время работы Системы произошла ошибка.");
                console.error(error);
            }

            $scope.calculateOrganizationStatistics = function() {
                if ($scope.dumpOfRogStatics == null) {
                    return;
                }

                resetMapData();

                fillRealRegistryOrganizations($scope.dumpOfRogStatics.regionOrganizationStatistics, $scope.dumpOfRogStatics.totalOrgCount);
                fillPlanRegistryOrganizations($scope.dumpOfRogStatics.planRegistryOrganizationByRegion, $scope.dumpOfRogStatics.planTotalOrgCount);
                fillFederalStatistic($scope.dumpOfRogStatics);
                $scope.percentageOfRealOrganizations = $scope.numberOfPlanOrganizations === 0 ? 0 : $scope.numberOfRealOrganizations * 100 / $scope.numberOfPlanOrganizations;

                redraw();
            };

            function redraw() {
                calculatePercentage();

                sort();
                drawMap();
                initTable();
            }

            var HOUSE_BY_DIRECT_CONTROL = '1';
            var HOUSE_BY_MANAGEMENT_ORGANIZATION = '5';
            var HOUSE_BY_COOPERATIVE = '234';
            var HOUSE_BY_ANOTHER_WAY = '6';
            var HOUSE_BY_UNKNOWN = null;
            var HOUSE_JD = '7';
            var HOUSE_MKD = '8';

            $scope.consts = $scope.const || {};
            $scope.consts.HOUSE_BY_DIRECT_CONTROL = HOUSE_BY_DIRECT_CONTROL;
            $scope.consts.HOUSE_BY_MANAGEMENT_ORGANIZATION = HOUSE_BY_MANAGEMENT_ORGANIZATION;
            $scope.consts.HOUSE_BY_COOPERATIVE = HOUSE_BY_COOPERATIVE;
            $scope.consts.HOUSE_BY_ANOTHER_WAY = HOUSE_BY_ANOTHER_WAY;
            $scope.consts.HOUSE_BY_UNKNOWN = HOUSE_BY_UNKNOWN;
            $scope.consts.HOUSE_MKD = HOUSE_MKD;
            $scope.consts.HOUSE_JD = HOUSE_JD;


            $scope.countHouse = function(currentRegionStatistic) {
                var num = 0;
                if($scope.getEnableApartmentHouseStatics()) {
                    num += getMKDHouseCount(currentRegionStatistic);
                }
                if ($scope.model.managementHouseJD) {
                    num += currentRegionStatistic.managementHouse[HOUSE_JD];
                }

                return num;
            };

            $scope.countPlanHouse = function(currentRegionStatistic) {
                var num = 0;
                if($scope.getEnableApartmentHouseStatics()) {
                    num += getPlanMKDHouseCount(currentRegionStatistic);
                }
                if($scope.model.managementHouseJD) {
                    if (currentRegionStatistic.planManagementHouse[HOUSE_JD]) {
                        num += currentRegionStatistic.planManagementHouse[HOUSE_JD];
                    }
                }
                return num;
            };

            function getPlanHousePercent(currentRegionStatistic) {
                var numberOfPlanHouses = $scope.countPlanHouse(currentRegionStatistic);
                var numberOfHouses =  $scope.countHouse(currentRegionStatistic);

                return getTablePlanPercent(numberOfPlanHouses, numberOfHouses);
            }

            $scope.getPlanHousePercentStr = function(currentRegionStatistic) {
                var planPercent = getPlanHousePercent(currentRegionStatistic);
                if (!planPercent) {
                    return '';
                }

                return $scope.formatPercentage(planPercent) + '% ';
            };

            $scope.getPlanApartamentHousePercentStr = function(currentRegionStatistic) {
                var planMKDHouseCount = getPlanMKDHouseCount(currentRegionStatistic);
                if (!planMKDHouseCount) {
                    return '';
                }

                return '('+$scope.formatPercentage(100 * getMKDHouseCount(currentRegionStatistic) / planMKDHouseCount) + '%' + ')';
            };

            $scope.getPlanDwellingHousePercentStr = function(currentRegionStatistic) {
                if (!currentRegionStatistic.planManagementHouse[HOUSE_JD]) {
                    return '';
                }

                return '('+$scope.formatPercentage(100*currentRegionStatistic.managementHouse[HOUSE_JD]/currentRegionStatistic.planManagementHouse[HOUSE_JD]) + '%'+')';
            };

            function getPlanMKDHouseCount(currentRegionStatistic){
                var num = 0;
                if($scope.getEnableApartmentHouseStatics() && currentRegionStatistic.planManagementHouse) {
                    if ($scope.model.managementHouseByDirectControl && currentRegionStatistic.planManagementHouse[HOUSE_BY_DIRECT_CONTROL]) {
                        num += currentRegionStatistic.planManagementHouse[HOUSE_BY_DIRECT_CONTROL];
                    }
                    if ($scope.model.managementHouseByManagementOrganization && currentRegionStatistic.planManagementHouse[HOUSE_BY_MANAGEMENT_ORGANIZATION]) {
                        num += currentRegionStatistic.planManagementHouse[HOUSE_BY_MANAGEMENT_ORGANIZATION];
                    }
                    if ($scope.model.managementHouseByManagementCooperative && currentRegionStatistic.planManagementHouse[HOUSE_BY_COOPERATIVE]) {
                        num += currentRegionStatistic.planManagementHouse[HOUSE_BY_COOPERATIVE];
                    }
                    if ($scope.model.managementHouseByAnotherWay && currentRegionStatistic.planManagementHouse[HOUSE_BY_ANOTHER_WAY]) {
                        num += currentRegionStatistic.planManagementHouse[HOUSE_BY_ANOTHER_WAY];
                    }
                }
                return num;
            }

            function getMKDHouseCount(currentRegionStatistic, isTotal) {
                var num = 0;
                if(($scope.getEnableApartmentHouseStatics() || isTotal) && currentRegionStatistic.managementHouse) {
                    if ($scope.model.managementHouseByDirectControl && $scope.model.managementHouseByDirectControl || isTotal) {
                        num += currentRegionStatistic.managementHouse[HOUSE_BY_DIRECT_CONTROL];
                    }
                    if ($scope.model.managementHouseByManagementOrganization && $scope.model.managementHouseByManagementOrganization || isTotal) {
                        num += currentRegionStatistic.managementHouse[HOUSE_BY_MANAGEMENT_ORGANIZATION];
                    }
                    if ($scope.model.managementHouseByManagementCooperative && $scope.model.managementHouseByManagementCooperative || isTotal) {
                        num += currentRegionStatistic.managementHouse[HOUSE_BY_COOPERATIVE];
                    }
                    if ($scope.model.managementHouseByAnotherWay && $scope.model.managementHouseByAnotherWay || isTotal) {
                        num += currentRegionStatistic.managementHouse[HOUSE_BY_ANOTHER_WAY];
                    }
                    if ($scope.model.managementHouseByUnknown && $scope.model.managementHouseByUnknown || isTotal) {
                        num += currentRegionStatistic.managementHouse[HOUSE_BY_UNKNOWN];
                    }
                }
                return num;
            }


            function getTablePlanPercent(plan, real) {
                if (!plan) {
                    return 0;
                }

                var percent;
                if (real) {
                    percent = 100.0 * real / plan;
                } else {
                    percent = 0.001;
                }
                return percent>100 && $scope.limitProcent? 100: percent;
            }

            function calculateHousesStatistics(houseStaticFromServer, planHouseStaticFromServer, regions) {
                var mapRegion = {};
                $scope.numberOfManagementHouse = 0;
                $scope.planOfManagementHouse = 0;
                $scope.numberOfJDHouse = 0;
                $scope.planOfJDHouse = 0;
                //подготовка катры для получения guid по коду региона
                angular.forEach(regions, function (region) {
                    if (region.areaCode === '000') {
                        mapRegion[region.regionCode] = region.aoGuid;
                    }
                });

                var totalJD = 0;
                var totalMkd = 0;

                angular.forEach($scope.mapData, function (value) {
                    value.managementHouseCount = 0;
                    value.managementHouse = {};
                    value.managementHouse[HOUSE_BY_DIRECT_CONTROL] = 0;
                    value.managementHouse[HOUSE_BY_MANAGEMENT_ORGANIZATION] = 0;
                    value.managementHouse[HOUSE_BY_COOPERATIVE] = 0;
                    value.managementHouse[HOUSE_BY_ANOTHER_WAY] = 0;
                    value.managementHouse[HOUSE_BY_UNKNOWN] = 0;
                    value.managementHouse[HOUSE_JD] = 0;
                    //подготовка данных к отображению
                    value.regionCode = mapRegion[value.id];
                    if (houseStaticFromServer && houseStaticFromServer.houseCountMap) {
                        angular.forEach(houseStaticFromServer.houseCountMap[mapRegion[value.id]], function (count) {
                            value.managementHouseCount += count.houseCount;
                            if (count.houseTypeCode === '1') {
                                value.managementHouse[count.managementTypeCode] = count.houseCount;
                                if (count.managementTypeCode === '2' || count.managementTypeCode === '3' || count.managementTypeCode === '4') {
                                    value.managementHouse[HOUSE_BY_COOPERATIVE] += count.houseCount;
                                }
                            } else {
                                value.managementHouse[HOUSE_JD] += count.houseCount;
                                $scope.numberOfJDHouse += count.houseCount;
                            }
                        });
                    }
                    value.managementHouse[HOUSE_MKD] = getMKDHouseCount(value);
                    //Расчет планового колличества домов
                    value.planManagementHouse = {};
                    if (planHouseStaticFromServer[mapRegion[value.id]]) {
                        //расчет без учента галочек
//                        value.planManagementHouse[HOUSE_MKD] = 0;
                        //расчет без учента галочек
//                        value.planManagementHouse[HOUSE_JD] = 0;
                        value.planManagementHouse[HOUSE_BY_DIRECT_CONTROL] = planHouseStaticFromServer[mapRegion[value.id]].apartmentHousePrivateManagmentCount;
//                        value.planManagementHouse[HOUSE_MKD] += value.planManagementHouse[HOUSE_BY_DIRECT_CONTROL]?value.planManagementHouse[HOUSE_BY_DIRECT_CONTROL]:0;
                        value.planManagementHouse[HOUSE_BY_MANAGEMENT_ORGANIZATION] = planHouseStaticFromServer[mapRegion[value.id]].apartmentHouseUKManagmentCount;
//                        value.planManagementHouse[HOUSE_MKD] += value.planManagementHouse[HOUSE_BY_MANAGEMENT_ORGANIZATION]?value.planManagementHouse[HOUSE_BY_MANAGEMENT_ORGANIZATION]:0;
                        value.planManagementHouse[HOUSE_BY_COOPERATIVE] = planHouseStaticFromServer[mapRegion[value.id]].apartmentHouseCooperativeManagmentCount;
//                        value.planManagementHouse[HOUSE_MKD] += value.planManagementHouse[HOUSE_BY_COOPERATIVE]?value.planManagementHouse[HOUSE_BY_COOPERATIVE]:0;
                        value.planManagementHouse[HOUSE_BY_ANOTHER_WAY] = planHouseStaticFromServer[mapRegion[value.id]].apartmentHouseUnknownManagmentCount;
//                        value.planManagementHouse[HOUSE_MKD] += value.planManagementHouse[HOUSE_BY_ANOTHER_WAY]?value.planManagementHouse[HOUSE_BY_ANOTHER_WAY]:0;

                        value.planManagementHouse[HOUSE_JD] = planHouseStaticFromServer[mapRegion[value.id]].dwellingHouseCount || 0;
                        $scope.planOfJDHouse += value.planManagementHouse[HOUSE_JD];
                    }

                    if (value.planManagementHouse[HOUSE_MKD] && value.managementHouse[HOUSE_MKD] && value.planManagementHouse[HOUSE_MKD] < value.managementHouse[HOUSE_MKD]) {
                        value.planManagementHouse[HOUSE_MKD] = value.managementHouse[HOUSE_MKD];
                    }

                    /*value.managementHouseCountTable = $scope.countHouse(value, true);
                     value.planManagementHouseCount = $scope.countPlanHouse(value);*/
                    value.planManagementHousePercent = {};
                    value.planManagementHouseTable = {};
                    value.managementHouseTable = {};

                    //расчет фактического количества ТОЛЬКО для МКД
                    value.managementHouseTable[HOUSE_MKD] = getMKDHouseCount(value);
                    value.managementHouseTable[HOUSE_JD] = value.managementHouse[HOUSE_JD];

                    //расчет планового количества ТОЛЬКО для МКД
                    value.planManagementHouseTable[HOUSE_MKD] = getPlanMKDHouseCount(value);
                    if ($scope.limitProcent && value.planManagementHouseTable[HOUSE_MKD] && value.managementHouseTable[HOUSE_MKD] && value.planManagementHouseTable[HOUSE_MKD] < value.managementHouseTable[HOUSE_MKD]) {
                        value.planManagementHouseTable[HOUSE_MKD] = value.managementHouseTable[HOUSE_MKD];
                    }
                    value.planManagementHouseTable[HOUSE_JD] = value.planManagementHouse[HOUSE_JD];
                    if ($scope.limitProcent && value.planManagementHouseTable[HOUSE_JD] && value.managementHouseTable[HOUSE_JD] && value.planManagementHouseTable[HOUSE_JD] < value.managementHouseTable[HOUSE_JD]) {
                        value.planManagementHouseTable[HOUSE_JD] = value.managementHouseTable[HOUSE_JD];
                    }

                    value.planManagementHousePercent[HOUSE_MKD] = getTablePlanPercent( value.planManagementHouseTable[HOUSE_MKD], value.managementHouseTable[HOUSE_MKD]);
                    value.planManagementHousePercent[HOUSE_JD] = getTablePlanPercent( value.planManagementHouse[HOUSE_JD], value.managementHouseTable[HOUSE_JD]);

                    $scope.numberOfManagementHouse += getMKDHouseCount(value);
                    $scope.planOfManagementHouse += getPlanMKDHouseCount(value);

                    if(!$scope.totalMKDCountInSystem){
                        totalMkd += getMKDHouseCount(value, true);
                    }

                    if(!$scope.totalJDCountInSystem){
                        totalJD += value.managementHouseTable[HOUSE_JD];
                    }
                });

                $scope.totalMKDCountInSystem = $scope.totalMKDCountInSystem?$scope.totalMKDCountInSystem:totalMkd;
                $scope.totalJDCountInSystem = $scope.totalJDCountInSystem?$scope.totalJDCountInSystem:totalJD;

                redraw();
            }

            $scope.isEmptyPlanOfManagementHouse = function() {
                return !$scope.planOfManagementHouse;
            };

            function getMapRegionData(regionCode) {
                var mapRegionData = null;
                angular.forEach($scope.mapData, function (value) {
                    if (value.id == regionCode) {
                        mapRegionData = value;
                    }
                });

                return mapRegionData;
            }

            function resetMapData() {
                $scope.numberOfRealOrganizations = 0;
                $scope.numberOfPlanOrganizations = 0;
                federalRegionClear();
                angular.forEach($scope.mapData, function (value) {
                    value.real = 0;
                    value.plan = 0;
                    value.percentage = 0;
                    value.fill = MAP_COLORS.GREY_COLOR;
                    value.orgCountByRole = {};
                    value.regionCode = null;
                    value.realOrgCount = 0;
                    value.planOrgCount = 0;
                });
            }

            function fillRealRegistryOrganizations(regionOrganizationStatistics, totalOrgCount) {
                $scope.numberOfRealOrganizations = totalOrgCount;
                angular.forEach(regionOrganizationStatistics, function (region_data, region_code) {
                    var mapRegionData = getMapRegionData(region_code);
                    if (mapRegionData) {
                        if (region_data && region_data.region && region_data.region.guid) {
                            mapRegionData.regionCode = region_data.region.code;
                        }
                        if (region_data.orgCount) {
                            mapRegionData.realOrgCount = region_data.orgCount;
                        }

                        //HCS-30734 Во всплывающем окне, полномочия НЕ все Полномочия отображаются, если факт - 0 или отсутствует
                        //APPROVED_ORG_ROLES_CODES
                        angular.forEach(APPROVED_ORG_ROLES_CODES,function (role_code){
                            if (_.contains(MAIN_ORG_ROLES_CODES, role_code)) {
                                mapRegionData.orgCountByRole[role_code] = {"count":0, "percentage":0 + '%'};
                            } else {
                                mapRegionData.orgCountByRole[role_code] = 0;
                            }
                        });
                        mapRegionData.orgCountByRole[101] = {"count":0, "percentage":0 + '%'};
                        mapRegionData.orgCountByRole[102] = {"count":0, "percentage":0 + '%'};
                        mapRegionData.orgCountByRole[103] = {"count":0, "percentage":0 + '%'};
                        mapRegionData.orgCountByRole[70] = {"count":0, "percentage":0 + '%'};
                        mapRegionData.orgCountByRole[80] = {"count":0, "percentage":0 + '%'};
                        mapRegionData.orgCountByRole[18] = {"count":0, "percentage":0 + '%'};
                        angular.forEach(region_data.orgCountByRole, function (data, role_code) {
                            //Фильтруем по требуемым полномочиям
                            if (data && !_.contains(FILTER_FEDERAL_ORG_ROLES_CODES, role_code)) {
                                if (role_code == "101" || role_code == "102" || role_code == "103") {
                                    //HCS-24011 Агрегирование значений по ролям УО
                                    //однако согласно HCS-24839 в mapRegionData.orgCountByRole для ролей
                                    // будет не колличество организаций а проценты к плану по формулам из HCSANALYST-673
                                    mapRegionData.orgCountByRole[1] = {"count":getVal(mapRegionData.orgCountByRole[1]) + data, "percentage":0 + '%'};
                                    mapRegionData.orgCountByRole[role_code] = {"count":data, "percentage":0 + '%'};
                                } else if (_.contains(UO_ORG_ROLES_CODES, role_code)) {
                                    //HCSANALYST-595 выбор всех ОГВ в агрегированном виде «Органы государственной власти субъекта РФ»
                                    // однако в расшифровке должны присутствовать все роли по отдельности
                                    mapRegionData.orgCountByRole[70] = {"count":getVal(mapRegionData.orgCountByRole[70]) + data, "percentage":0 + '%'};
                                    mapRegionData.orgCountByRole[role_code] = data;
                                } else if (role_code == EXECUTIVE_AUTHORITY_IN_CHARGE_OF_MUNICIPAL_RESIDENTIAL_CONTROL.code || role_code == LOCAL_GOVERNMENT_AUTHORITY.code) {
                                    mapRegionData.orgCountByRole[80] = {"count":getVal(mapRegionData.orgCountByRole[80]) + data, "percentage":0 + '%'};
                                    mapRegionData.orgCountByRole[role_code] = data;
                                } else if (_.contains(MAIN_ORG_ROLES_CODES, role_code)) {
                                    mapRegionData.orgCountByRole[role_code] = {"count":data, "percentage":0 + '%'};
                                } else {
                                    mapRegionData.orgCountByRole[role_code] = data;
                                }
                                mapRegionData.real += data;
                            }
                        });
                    }
                });
            }

            //расчет планового количества ТОЛЬКО для МКД
            function getVal(val){
                return val?val.count:0;
            }

            //расчет процента ТОЛЬКО для МКД
            function fillPlanRegistryOrganizations(planRegistryOrganizationByRegion, planTotalOrgCount) {
                $scope.numberOfPlanOrganizations = planTotalOrgCount;
                angular.forEach(planRegistryOrganizationByRegion, function (region_data, region_code) {
                    var mapRegionData = getMapRegionData(region_code);
                    if (mapRegionData /*&& region_data.orgCount*/) {
                        mapRegionData.planOrgCount = region_data.orgCount;
                        mapRegionData.plan = 0;
                        //HCS-33225 план по УО содержет 0
                        var planUOContains0 = false;
                        var omsSum, uoSum, sauoSum;
                        angular.forEach(region_data.orgCountByRole, function (data, role_code) {
                            if (role_code == "101" || role_code == "102" || role_code == "103") {
                                var fact = getVal(mapRegionData.orgCountByRole[role_code]);
                                var value = ((fact < data) || (!$scope.limitProcent)) ? data : fact;
                                // согласно HCS-24839 в mapRegionData.orgCountByRole для ролей
                                // будет не колличество организаций а проценты к плану по формулам из HCSANALYST-673
                                mapRegionData.orgCountByRole[role_code] = {"count":fact||0, "percentage":0 + '%'/*, "plan":value*/};
                                if(data !== 0) {
                                    mapRegionData.orgCountByRole[role_code].percentage = $scope.formatPercentage(fact / value * 100) + '%';
                                    sauoSum = (sauoSum ||0) + value;
                                } else {
                                    planUOContains0 = (planUOContains0)||(mapRegionData.orgCountByRole[role_code].count > 0);
                                }
                            } else if (role_code == EXECUTIVE_AUTHORITY_IN_CHARGE_OF_MUNICIPAL_RESIDENTIAL_CONTROL.code || role_code == LOCAL_GOVERNMENT_AUTHORITY.code) {
                                omsSum = (omsSum ||0) + data;
                            } else if (_.contains(UO_ORG_ROLES_CODES, role_code)) {
                                uoSum = (uoSum || 0) + data;
                            }
                        });
                        //HCSANALYST-673 Согласно уточнения, если сумма по ОГВ или сумма ОМС ноль, то и процент == 0
                        // if((omsSum===undefined || omsSum !== 0) && (uoSum===undefined || uoSum!== 0) && (sauoSum===undefined || sauoSum!== 0)) {
                        if((omsSum===undefined || omsSum !== 0) || (uoSum===undefined || uoSum!== 0) || (sauoSum===undefined || sauoSum!== 0)) {
                            //суммирование агрегированных ролей
                            if(omsSum) {
                                mapRegionData.plan += (((getVal(mapRegionData.orgCountByRole[80]) < omsSum&&omsSum!==0))||(!$scope.limitProcent)) ? omsSum : getVal(mapRegionData.orgCountByRole[80]);
                                if(mapRegionData.orgCountByRole[80]) {
                                    mapRegionData.orgCountByRole[80].percentage = $scope.formatPercentage(getVal(mapRegionData.orgCountByRole[80]) / omsSum * 100) + '%';
                                }
                            }
                            if(uoSum) {
                                mapRegionData.plan += ((getVal(mapRegionData.orgCountByRole[70]) < uoSum&&uoSum!==0)||(!$scope.limitProcent)) ? uoSum : getVal(mapRegionData.orgCountByRole[70]);
                                if(mapRegionData.orgCountByRole[70]) {
                                    mapRegionData.orgCountByRole[70].percentage = $scope.formatPercentage(getVal(mapRegionData.orgCountByRole[70]) / uoSum * 100) + '%';
                                }
                            }
                            if(sauoSum) {
                                mapRegionData.plan += ((getVal(mapRegionData.orgCountByRole[1]) < sauoSum&&sauoSum!==0)||(!$scope.limitProcent)) ? sauoSum : getVal(mapRegionData.orgCountByRole[1]);
                                if(mapRegionData.orgCountByRole[1]) {
                                    mapRegionData.orgCountByRole[1].percentage = $scope.formatPercentage(getVal(mapRegionData.orgCountByRole[1]) / sauoSum * 100) + '%';
                                    mapRegionData.orgCountByRole[1].percentage = planUOContains0?0 + '%':mapRegionData.orgCountByRole[1].percentage;
                                }
                            }
                            //обнуление, если любая из ролей == 0
                            var keepGoing = true;
                            angular.forEach(region_data.orgCountByRole, function (data, role_code) {
                                if (keepGoing) {
                                    //Фильтруем по требуемым полномочиям
                                    if (!_.contains(FILTER_FEDERAL_ORG_ROLES_CODES, role_code) && !_.contains(UO_ORG_ROLES_CODES, role_code) &&
                                        role_code !== EXECUTIVE_AUTHORITY_IN_CHARGE_OF_MUNICIPAL_RESIDENTIAL_CONTROL.code && role_code !== LOCAL_GOVERNMENT_AUTHORITY.code) {
                                        // если по любой роли ноль, то и процент == 0
                                        var realVal = getVal(mapRegionData.orgCountByRole[role_code]);
                                        if (data === 0 && realVal>0) {
                                            mapRegionData.plan = 0;
                                            keepGoing = false;
                                        } else if (role_code !== "101" && role_code !== "102" && role_code !== "103") {
                                            mapRegionData.plan += (realVal < data)||(!$scope.limitProcent) ? data : realVal;
                                            if (data > 0&&_.contains(MAIN_ORG_ROLES_CODES, role_code)){
                                                mapRegionData.orgCountByRole[role_code] = {"count":realVal, "percentage":$scope.formatPercentage(realVal / data * 100) + '%'};
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    }
                });

            }

            //Статистика по 3, 6, 15, 17
            function fillFederalStatistic(statistic) {
                var federalRealStat = statistic.regionOrganizationStatistics[FEDERAL_REGION_CODE];
                if (federalRealStat) {
                    if (federalRealStat.orgCount) {
                        $scope.federalRegion.realOrgCount = federalRealStat.orgCount;
                    }
                    angular.forEach(federalRealStat.orgCountByRole, function (data, role_code) {
                        //Фильтруем по требуемым полномочиям
                        if (data && _.contains(FILTER_FEDERAL_ORG_ROLES_CODES, role_code)) {
                            $scope.federalRegion.orgCountByRole[role_code] = data;
                            $scope.federalRegion.real += data;
                        }
                    });
                }

                var federalPlanStat = statistic.planRegistryOrganizationByRegion[FEDERAL_REGION_CODE];
                if (federalPlanStat && federalPlanStat.orgCount) {
                    angular.forEach(federalPlanStat.orgCountByRole, function (data, role_code) {
                        if (data && _.contains(FILTER_FEDERAL_ORG_ROLES_CODES, role_code)) {
                            $scope.federalRegion.plan += data;
                        }
                    });
                }
            }

            function calculatePercentage() {

                $scope.federalRegion.percentage = $scope.federalRegion.plan === 0 ? 0 : $scope.federalRegion.real * 100 / $scope.federalRegion.plan;
                console.log("calculatePercentage: ", $scope.federalRegion);
                angular.forEach($scope.mapData, function (value) {
                    value.planOrgPercentage = getTablePlanPercent(value.plan, value.real);
                    if($scope.model.enableOrgFilter&&($scope.getEnableApartmentHouseStatics()||$scope.model.managementHouseJD)) {
                        value.percentage = value.planOrgPercentage / 2 + getPlanHousePercent(value) / 2;
                    }else if(!$scope.model.enableOrgFilter&&($scope.getEnableApartmentHouseStatics()||$scope.model.managementHouseJD)){
                        value.percentage =getPlanHousePercent(value);
                        value.planOrgPercentage = 0;
                    } else if($scope.model.enableOrgFilter&&(!$scope.getEnableApartmentHouseStatics()&&!$scope.model.managementHouseJD)) {
                        value.percentage = value.planOrgPercentage;
                    } else {
                        value.percentage = 0;
                    }

                    value.fill = getColorOfOrgPercentage(value);
                });
            }

            function areSelectedAllRoles() {
                return $scope.model.organizationFilter.length == $scope.organizationRoles.length;
            }

            function isActiveOrgRoleByCode(code) {
                if (!$scope.model.enableOrgFilter || areSelectedAllRoles()) {
                    return true;
                }

                var result = false;
                angular.forEach($scope.model.organizationFilter, function (r) {
                    if (r.code == code) {
                        result = true;
                    }
                });

                return result;
            }

            /*function sendRequestForRegisteredOrganizationStatistics() {
             $PublicStatisticService.getRegisteredOrganizationStatistics(
             {},
             onReceivedRegisteredOrganizationStatistics,
             onError
             );
             }*/

            $scope.isMoscow = function(regionCode) {
                return angular.equals(regionCode, MOSKOW_REGION_CODE);
            };

            var houseStaticFromServer = null;
            var regions = null;
            var planHouseStaticFromServer = null;

            function initHouseStatistic() {
                $PublicStatisticService.getHousesStatistics(
                    {},
                    function (response) {
                        houseStaticFromServer = response;
                        if (regions && planHouseStaticFromServer) {
                            calculateHousesStatistics(houseStaticFromServer, planHouseStaticFromServer, regions);
                        }
                    },
                    onError
                );

                $PublicStatisticService.getPlanHousesStatistics(
                    {},
                    function (response) {
                        planHouseStaticFromServer = response;
                        if (regions && houseStaticFromServer) {
                            calculateHousesStatistics(houseStaticFromServer, planHouseStaticFromServer, regions);
                        }
                    },
                    onError
                );

                $FiasService.findRegions().then(
                    function (response) {
                        regions = response;
                        if (houseStaticFromServer && planHouseStaticFromServer) {
                            calculateHousesStatistics(houseStaticFromServer, planHouseStaticFromServer, regions);
                        }
                    },
                    onError
                );

            }

            //для раскраски карты
            initHouseStatistic();

            function initTable(event) {
                $('#headDiv').on('scroll', function () {
                    var that = $(this);
                    $('.body-div').each(function (index) {
                        $(this).scrollLeft(that.scrollLeft());
                    });
                });


                $timeout(function () {
                    $('.body-table-org-map tr').eq(1).find('td').each(function (index, value) {
                        $('.body-table-org-map tr').eq(1).find('td').eq(index).width(782 / $('.body-table-org-map tr').eq(1).find('td:not(.ng-hide)').length);
                        $('#headTable th').width(($scope.model.enableOrgFilter?782:774) / $('.body-table-org-map tr').eq(1).find('td:not(.ng-hide)').length);
                    });

                    $('#headTable th:not(.ng-hide)').last().width($('#headTable th:not(.ng-hide)').last().width()+38);
                });

            }

            $(window).resize(initTable);

            initTable();
            findOrganizationRole()
                .then($scope.changeOrgFilter);
        }]);

(function (angular) {'use strict';
    MapWithStaticsOfWaterQualityCtrl.$inject = ["$scope", "$state", "$PublicStatisticService", "MapData", "commonDialogs", "$timeout", "MAP_COLORS"];
    angular.module('pafo-common-web-package.main-forms')
        .controller('MapWithStaticsOfWaterQualityCtrl', MapWithStaticsOfWaterQualityCtrl);

    /* @ngInject */
    function MapWithStaticsOfWaterQualityCtrl($scope, $state, $PublicStatisticService, MapData, commonDialogs,
        $timeout, MAP_COLORS) {

        var mapData,
            RUSSIA_CODE = '00',
            RUSSIA_NAME = 'РОССИЙСКАЯ ФЕДЕРАЦИЯ';

        $scope.pageTitle = $state.current.data.pageTitle;
        $scope.breadcrumbs = $state.current.data.breadcrumbs;

        $scope.specifyRegion = function (regionStatistic) {$scope.currentRegionStatistic = regionStatistic;};

        $scope.getColorClassOfRegionPercentage = getColorClassOfRegionPercentage;
        $scope.sort = sort ;
        $(window).resize(initTable);

        getWaterQualityStatistics();


        function getWaterQualityStatistics() {
            resetMapData();

            $PublicStatisticService.getWaterQualityStatistics({},
                function (statisticsMap) {
                    angular.forEach(statisticsMap, function (regionData, regionCode) {
                        if (regionCode == RUSSIA_CODE) {
                            $scope.russiaStatistics.waterQualityStatistic = regionData;
                        } else {
                            var mapRegionData = getMapRegionData(regionCode);
                            if (mapRegionData) {
                                mapRegionData.waterQualityStatistic = regionData;
                                var wrongPercentage = getWrongPercentageNumber(regionData);
                                mapRegionData.waterQualityStatistic.wrongPercentage = wrongPercentage;
                                mapRegionData.fill = getColorOfOrgPercentage(wrongPercentage);
                            }
                        }
                    });

                    $scope.mapData = mapData;

                    $scope.tableData = angular.copy(mapData);
                    for (var i = 0; i < $scope.tableData.length; i++) {
                        if (!$scope.tableData[i].waterQualityStatistic) {
                            // В таблице не отображать регионы без статистики
                            $scope.tableData.splice(i, 1);
                            i--;
                        }
                    }

                    $scope.sort('name');
                    $scope.dataLoaded = true;

                    $timeout(function(){
                        initTable();
                    });
                },
                onError
            );
        }

        function onError(error) {
            commonDialogs.error("Во время работы Системы произошла ошибка.");
            console.error(error);
        }

        function resetMapData() {
            mapData = angular.copy(MapData);
            _.remove(mapData, function(value) {
                return value.id === '99';
            });
            $scope.tableData = angular.copy(mapData);
            $scope.russiaStatistics = {
                name: RUSSIA_NAME,
                waterQualityStatistic: angular.copy(MapData)
            };
        }

        function getMapRegionData(regionCode) {
            var mapRegionData = null;
            angular.forEach(mapData, function (value) {
                if (value.id == regionCode) {
                    mapRegionData = value;
                }
            });

            return mapRegionData;
        }

        //Система рассчитывает процент объектов как отношение значения из столбца
        //4 Таблицы 1 Исходные данные для отображения («Источников и водопроводов, не отвечающих санитарным нормам и правилам, Всего»)
        //к значению из столбца 3 Таблицы 1 Исходные данные для отображения («Число объектов»), умноженный на 100.
        //Если рассчитанное значение больше 100, значение принимается за «100»
        //Рассчитанное значение округляется до двух знаков после запятой по правилам математического округления.
        function getWrongPercentageNumber(regionInfo) {
            var wrongPercentage;
            //if (regionInfo && regionInfo.wrongSourcesTotal && regionInfo.objectsTotal) {
                wrongPercentage = regionInfo.wrongSourcesTotal * 100 / regionInfo.objectsTotal;
                if (wrongPercentage > 100) {
                    wrongPercentage = 100;
                }

                if (angular.isNumber(wrongPercentage)) {
                    wrongPercentage = wrongPercentage.toFixed(2);
                }
            //}
            return wrongPercentage;
        }

        function getColorOfOrgPercentage(wrongPercentage) {
            var color = '';
            if (wrongPercentage >= 40) {
                color = MAP_COLORS.RED_COLOR;
            } else if (wrongPercentage >= 21) {
                color = MAP_COLORS.ORANGE_COLOR;
            } else if (wrongPercentage >= 10) {
                color = MAP_COLORS.YELLOW_COLOR;
            } else if (wrongPercentage >= 0) {
                color = MAP_COLORS.GREEN_COLOR;
            } else {
                color = MAP_COLORS.GREY_COLOR;
            }

            return color;
        }

        function getColorClassOfRegionPercentage(regionInfo) {
            var wrongPercentage;

            if (regionInfo && regionInfo.waterQualityStatistic) {
                wrongPercentage  = regionInfo.waterQualityStatistic.wrongPercentage;
            }

            var color = '';
            if (wrongPercentage >= 40) {
                color = 'ico wlico5';
            } else if (wrongPercentage >= 21) {
                color = 'ico wlico4';
            } else if (wrongPercentage >= 10) {
                color = 'ico wlico3';
            } else if (wrongPercentage >= 0) {
                color = 'ico wlico2';
            } else {
                color = 'ico wlico1';
            }

            return color;
        }

        function sort(field) {
            if ($scope.sortedField != field) {
                $scope.sortedField = field;
                $scope.sortedDirect = 'asc';
            } else {
                $scope.sortedDirect = $scope.sortedDirect == 'asc' ? 'desc' : 'asc';
            }

            if ($scope.sortedField == 'name') {
                $scope.tableData.sort(alphabeticalSort);
            } else {
                $scope.tableData.sort(numericalSort);
            }
        }

        function alphabeticalSort(a, b, fieldName) {
            var A = '';
            var B = '';
            if (!fieldName) {
                fieldName = $scope.sortedField;
            }
            if ($scope.sortedDirect == 'asc') {
                A = a[fieldName].toLowerCase();
                B = b[fieldName].toLowerCase();
            } else {
                A = b[fieldName].toLowerCase();
                B = a[fieldName].toLowerCase();
            }
            if (A < B) {
                return -1;
            } else if (A > B) {
                return 1;
            } else {
                return 0;
            }
        }

        function numericalSort(a, b) {
            var firstValue = -1;
            var secondValue = -1;
            if (a.waterQualityStatistic) {
                firstValue = a.waterQualityStatistic[$scope.sortedField];
            }
            if (b.waterQualityStatistic) {
                secondValue = b.waterQualityStatistic[$scope.sortedField];
            }
            var A;
            var B;
            if ($scope.sortedDirect == 'asc') {
                A = firstValue;
                B = secondValue;
            } else {
                A = secondValue;
                B = firstValue;
            }

            var result = A - B;
            if (result === 0) { //добавлен для https://jira.lanit.ru/browse/HCS-24364
                return alphabeticalSort(a, b, 'name');
            } else {
                return result;
            }
        }

        function initTable(){
            $('#headDiv').on('scroll', function () {
                var that = $(this);
                $('.body-div').each(function(index){
                    $(this).scrollLeft(that.scrollLeft());
                });
            });
            $('.body-div').on('scroll', function () {
                var that = $(this);
                $('#body-div-1').each(function(index){
                    $(this).scrollTop(that.scrollTop());
                });
            });
            /*$('.body-table-water-map tr').eq(0).children().each(function(index){
                $(this).css('padding-left', 64-$(this).width())
            });*/

        }
    }
})(angular);

(function (angular) {
    'use strict';
    PublicMkdOdpu2Ctrl.$inject = ["$state", "MapData", "STAT_WIDG_COMMUNAL_RESOURCES", "MAP_COLORS", "intanTerritorySelect", "publicStatisticPublicMkdOdpu2Rest", "publicStatisticError", "publicStatisticNumeralCoherentText", "intanPercent"];
    angular.module('pafo-common-web-package')
        .controller('publicStatisticPublicMkdOdpu2Ctrl', PublicMkdOdpu2Ctrl);

    /* @ngInject */
    function PublicMkdOdpu2Ctrl($state, MapData, STAT_WIDG_COMMUNAL_RESOURCES, MAP_COLORS, intanTerritorySelect,
                                publicStatisticPublicMkdOdpu2Rest, publicStatisticError, publicStatisticNumeralCoherentText, intanPercent) {

        var vm = this,
            totalFormattedName = 'По стране в целом',
            range = mkdOdpuRange(),
            chartTotalData,
            selectedRegion;

        vm.numeralCoherentText = publicStatisticNumeralCoherentText;

        vm.pageTitle = $state.current.data.pageTitle;
        vm.breadcrumbs = $state.current.data.breadcrumbs;

        vm.date = new Date();

        vm.minYear = 1900;
        vm.maxYear = (new Date()).getFullYear();
        vm.yearRange = [];
        vm.onStopSlide = queryRegionsData;

        vm.resource = "5"; // По умолчанию установлен ресурс Тепловая энергия
        vm.resources = STAT_WIDG_COMMUNAL_RESOURCES;
        vm.resourceChange = queryRegionsData;
        vm.resourceName = resourceName;

        vm.specifyRegion = function (region) {
            vm.specifiedRegion = region;
        };
        vm.selectRegion = selectRegion;

        vm.selectTerritory = selectTerritory;
        vm.clearTerritory = clearTerritory;

        vm.showChartTip = showChartTip;
        vm.hideChartTip = hideChartTip;
        vm.yearsRangeForTooltip = yearsRangeForTooltip;

        vm.managementTypesAvailable = function(reg) {
            return reg.directControlMkdPercent || reg.managementOrganizationMkdPercent || reg.tsjMkdPercent || reg.zkMkdPercent ||
                reg.cooperativeMkdPercent || reg.noControlMkdPercent || reg.unpublishedMkdPercent;
        };

        queryRegionsData();


        function mkdOdpuRange() {
            var ranges = [
                {begin: 10, end: 100, color: MAP_COLORS.GREEN_COLOR, style: 'wlico2', name: 'более 10%'},
                {begin: 6, end: 10, color: MAP_COLORS.YELLOW_COLOR, style: 'wlico3', name: '6 - 10%'},
                {begin: 3, end: 6, color: MAP_COLORS.ORANGE_COLOR, style: 'wlico4', name: '3 - 6%'},
                {begin: 0, end: 3, color: MAP_COLORS.RED_COLOR, style: 'wlico5', name: 'до 3%'}
            ];

            return {
                list: rangeList,
                color: rangeColor
            };

            function rangeList() {
                return ranges;
            }

            function rangeColor(value) {
                var color = MAP_COLORS.GREY_COLOR;

                for (var i = 0, range; i < ranges.length; i++) {
                    range = ranges[i];
                    if (value >= range.begin && value <= range.end) {
                        color = range.color;
                        break;
                    }
                }

                return color;
            }
        }

        function getFromYear() {
            return vm.yearRange[0] || vm.minYear;
        }

        function getToYear() {
            return vm.yearRange[1] || vm.maxYear;
        }

        function yearsRangeForTooltip() {
            return (getFromYear() == getToYear()) ? ('- ' + getFromYear()) : ('c ' + getFromYear() + ' по ' + getToYear());
        }

        function resourceName() {
            var result = '';
            angular.forEach(vm.resources, function (resource) {
                if (resource.code == vm.resource) {
                    result = '\"' + resource.name + '\"';
                }
            });
            return result;
        }

        function queryRegionsData() {
            var params = {
                operationYearFrom: getFromYear(),
                operationYearTo: getToYear(),
                resourceCode: vm.resource
            };

            publicStatisticPublicMkdOdpu2Rest.getData(params)
                .then(displayRegionsData, publicStatisticError);
        }

        function displayRegionsData(data) {
            var barChartData;

            if (!data) {
                return;
            }

            vm.ranges = range.list();

            fillMap(data.items);

            selectedRegion = null;

            vm.selectedTerritoryName = null;

            if (data.allRegionsMunResources) {
                data.allRegionsMunResources.formattedName = totalFormattedName;
                chartTotalData = data.allRegionsMunResources;
                barChartData = {total: chartTotalData};
            }

            fillBarChart(barChartData);
        }

        function fillMap(regionsData) {
            var regionsMapData;

            if (regionsData === null) {
                return;
            }

            regionsMapData = angular.copy(MapData);

            regionsMapData.forEach(putRegionMapData);

            vm.mapData = regionsMapData;


            function putRegionMapData(regionMapData) {
                var regionData = regionsData.filter(function (regData) {
                    return parseInt(regionMapData.id, 10) === regData.regionCode;
                })[0];

                if (regionData) {
                    regionMapData.mainValue = intanPercent(regionData.regionMkdOdpuRate);

                    regionMapData.directControlMkdPercent = regionData.directControlMkdOdpuRate;
                    regionMapData.managementOrganizationMkdPercent = regionData.managementOrganizationMkdOdpuRate;
                    regionMapData.tsjMkdPercent = regionData.tsjMkdOdpuRate;
                    regionMapData.zkMkdPercent = regionData.zkMkdOdpuRate;
                    regionMapData.cooperativeMkdPercent = regionData.cooperativeMkdOdpuRate;
                    regionMapData.noControlMkdPercent = regionData.noControlMkdOdpuRate;
                    regionMapData.unpublishedMkdPercent = regionData.unpublishedMkdOdpuRate;

                    regionMapData.totalMkd = regionData.regionMkdCount;

                    regionMapData.regionAoGuid = regionData.regionAoguid;
                    regionMapData.regionOktmoCode = regionData.regionOktmoCode;

                    regionMapData.regionMunResources = regionData.regionMunResources;
                }

                regionMapData.fill = range.color(regionMapData.mainValue);
            }
        }

        function selectRegion(regionMapData) {
            if (!regionMapData.totalMkd) {
                return;
            }

            selectedRegion = regionMapData;

            vm.selectedTerritoryName = selectedRegion.name;

            regionMapData.regionMunResources.formattedName = selectedRegion.name;

            fillBarChart({
                total: chartTotalData,
                region: selectedRegion.regionMunResources
            });
        }

        function selectTerritory() {
            var params;

            if (selectedRegion) {
                params = {
                    regionAoGuid: selectedRegion.regionAoGuid,
                    regionOktmoCode: selectedRegion.regionOktmoCode
                };
            }

            intanTerritorySelect(params).then(queryTerritoryData);
        }

        function queryTerritoryData(territory) {
            var params = {
                    operationYearFrom: getFromYear(),
                    operationYearTo: getToYear()
                },
                formattedNames = {total: totalFormattedName};

            if (territory.fias) {
                params.regionGuid = territory.fias.regionGuid;
                formattedNames.region = territory.fias.regionFormattedName;

                if (territory.fias.areaGuid) {
                    params.areaGuid = territory.fias.areaGuid;
                    formattedNames.mun1 = territory.fias.areaFormattedName;
                }
                if (territory.fias.cityGuid) {
                    params.cityGuid = territory.fias.cityGuid;
                    formattedNames.mun2 = territory.fias.cityFormattedName;
                }
                if (territory.fias.settlementGuid) {
                    params.placeGuid = territory.fias.settlementGuid;
                    formattedNames.place = territory.fias.settlementFormattedName;
                }
            }
            else if (territory.oktmo) {
                params.regionCode = territory.oktmo.regionCode;
                formattedNames.region = territory.oktmo.regionFormattedName;

                if (territory.oktmo.level3Code) {
                    params.mun1Code = territory.oktmo.level3Code;
                    formattedNames.mun1 = territory.oktmo.level3FormattedName;
                }
                if (territory.oktmo.level5Code) {
                    params.mun2Code = territory.oktmo.level5Code;
                    formattedNames.mun2 = territory.oktmo.level5FormattedName;
                }
                if (territory.oktmo.level7Code) {
                    params.placeCode = territory.oktmo.level7Code;
                    formattedNames.place = territory.oktmo.level7FormattedName;
                }
            }
            else {
                return;
            }

            publicStatisticPublicMkdOdpu2Rest.getRegionData(params)
                .then(setTerritory, publicStatisticError);


            function setTerritory(territoryData) {
                if (!territoryData) {
                    return;
                }

                Object.keys(territoryData.stats).forEach(function (key) {
                    territoryData.stats[key].formattedName = formattedNames[key];
                });

                fillBarChart(territoryData.stats);

                vm.selectedTerritoryName = territory.formattedName;
            }
        }

        function clearTerritory() {
            if (vm.selectedTerritoryName) {
                return;
            }

            selectedRegion = null;

            fillBarChart({total: chartTotalData});
        }

        function fillBarChart(data) {
            if (!data || !Object.keys(data).filter(function (key) {
                    return data[key];
                }).length) {
                vm.barChartData = null;
                return;
            }

            vm.barChartOptions = {
                axes: {
                    color: '#a2a2a2',
                    x: {},
                    y: {label: 'Оснащено приборами учета, %'}
                },
                height: 600,
                width: 900,
                margin: {
                    left: 70,
                    bottom: 100
                },
                labelBarHeight: 90,
                barItem: {
                    verticalLabel: true
                }
            };

            vm.barChartData = [
                {
                    id: 'resource_1',
                    label: 'Холодная\nвода',
                    tipLabel: 'холодного водоснабжения'
                },
                {
                    id: 'resource_2',
                    label: 'Горячая\nвода',
                    tipLabel: 'горячего водоснабжения'
                },
                {
                    id: 'resource_3',
                    label: 'Электрическая\nэнергия',
                    tipLabel: 'электроснабжения'
                },
                {
                    id: 'resource_4',
                    label: 'Газ',
                    tipLabel: 'газоснабжения'
                },
                {
                    id: 'resource_5',
                    label: 'Тепловая\nэнергия',
                    tipLabel: 'теплоснабжения'
                },
                {
                    id: 'resource_8',
                    label: 'Сточные\nбытовые\nводы',
                    tipLabel: 'водоотведения'
                }
            ].map(function (group) {
                    group.data = [];
                    return group;
                });

            [
                {
                    id: 'total',
                    color: '#cf4229'
                },
                {
                    id: 'region',
                    color: '#29a2cf'
                },
                {
                    id: 'mun1',
                    color: '#f8ae1b'
                },
                {
                    id: 'mun2',
                    color: '#69ce34'
                },
                {
                    id: 'place',
                    color: '#fe285b'
                }
            ].forEach(function (bar) {
                    var barData = data[bar.id];

                    if (barData) {
                        vm.barChartData.forEach(putGroupData);
                    }


                    function putGroupData(group) {
                        // идентификатор должен начинаться с буквы, без префикса код услуги не подходит
                        var groupBarData = barData[group.id.split('resource_')[1]];

                        if (groupBarData) {
                            group.data.push({
                                value: intanPercent(groupBarData.percent),
                                barColor: bar.color,
                                tipLabel: barData.formattedName,
                                tipValue: groupBarData.num
                            });
                        }

                        if (groupBarData == null) {
                            group.data.push({
                                value: null,
                                barColor: bar.color,
                                tipLabel: barData.formattedName,
                                tipValue: 'Нет данных'
                            });
                        }
                    }
                });
        }

        function showChartTip(data) {
            vm.chartTipData = data;
        }

        function hideChartTip() {
            vm.chartTipData = null;
        }
    }
})(angular);

(function (angular) {'use strict';
    publicMkdOdpu2Rest.$inject = ["publicStatisticWidgetRestResource"];
    angular.module('pafo-common-web-package')
        .factory('publicStatisticPublicMkdOdpu2Rest', publicMkdOdpu2Rest);

    /* @ngInject */
    function publicMkdOdpu2Rest(publicStatisticWidgetRestResource) {
        var widget = createRestResources();

        return {
            getData: widget.housesOdpuEquipment2Data.get,
            getRegionData: widget.housesOdpuEquipment2RegionData.get
        };

        function createRestResources() {
            return {
                housesOdpuEquipment2Data: publicStatisticWidgetRestResource('/houses-odpu-equipment-2/data' +
                    '?operationYearFrom=:operationYearFrom' +
                    '&operationYearTo=:operationYearTo' +
                    '&resourceCode=:resourceCode'),

                housesOdpuEquipment2RegionData: publicStatisticWidgetRestResource('/houses-odpu-equipment-2/region-data' +
                    '?regionGuid=:regionGuid' +
                    '&areaGuid=:areaGuid' +
                    '&cityGuid=:cityGuid' +
                    '&placeGuid=:placeGuid' +
                    '&regionCode=:regionCode' +
                    '&mun1Code=:mun1Code' +
                    '&mun2Code=:mun2Code' +
                    '&placeCode=:placeCode' +
                    '&operationYearFrom=:operationYearFrom' +
                    '&operationYearTo=:operationYearTo')
            };
        }
    }
})(angular);

(function (angular) {'use strict';
    PublicMkdOdpuCtrl.$inject = ["$state", "MapData", "intanMunicipalResource", "intanHouseManagementTypes", "intanPercent", "SearchResource", "publicStatisticError", "publicStatisticNumeralCoherentText"];
    angular.module('pafo-common-web-package')
        .controller('publicStatisticPublicMkdOdpuCtrl', PublicMkdOdpuCtrl);

    /* @ngInject */
    function PublicMkdOdpuCtrl($state, MapData, intanMunicipalResource, intanHouseManagementTypes,
        intanPercent, SearchResource, publicStatisticError, publicStatisticNumeralCoherentText) {

        var vm = this,
            housesOdpuEquipmentResource = new SearchResource('/widget/houses-odpu-equipment'),
            queryHousesOdpuEquipment = function (params) {return housesOdpuEquipmentResource.queryPost({}, params);},
            regionsData,
            THERMAL_ENERGY_MUNICIPAL_RESOURCE_CODE = '5',
            munResources = intanMunicipalResource({meteringDevicesAvailable: true}),
            selectedParams = {},
            selectedResourceName;

        vm.pageTitle = $state.current.data.pageTitle;
        vm.breadcrumbs = $state.current.data.breadcrumbs;

        vm.yearInterval = {};

        vm.houseManagementTypes = intanHouseManagementTypes().map(function (type) {type.id = type.code; return type;});
        vm.selectedHouseManagementTypes = vm.houseManagementTypes.slice();
        vm.getHouseManagementTypeHeader = getHouseManagementTypeHeader;

        vm.munResourceCodes = munResources.map(function (resource) {return resource.code;});
        vm.munResourceNames = munResources.reduce(function (map, resource) {map[resource.code] = resource.name; return map;}, {});
        vm.selectedResourceCode = THERMAL_ENERGY_MUNICIPAL_RESOURCE_CODE;

        vm.specifyRegion = function (region) {vm.specifiedRegion = region;};

        vm.getMkdCountMessage = getMkdCountMessage;

        vm.getData = getData;

        getData();


        function getData() {
            var params;

            if (!vm.yearInterval.isValid) {
                return;
            }

            params = {
                constructionYearFrom: vm.yearInterval.yearFrom,
                constructionYearTo: vm.yearInterval.yearTo,
                houseManagementTypes: vm.selectedHouseManagementTypes.map(function (type) {return type.code;}),
                resourceCode: vm.selectedResourceCode
            };

            if (angular.equals(params, selectedParams)) {
                return;
            }

            angular.copy(params, selectedParams);

            queryHousesOdpuEquipment(params).then(setData, publicStatisticError);
        }

        function setData(data) {
            var regions,
                regionsByCode;

            regionsData = data.items;

            if (!regionsData.length) {
                vm.legend = null;
                vm.regions = [];
                return;
            }

            regions = angular.copy(MapData);
            regionsByCode = regions.reduce(function(map, region) {map[region.id] = region; return map;}, {});

            vm.date = data.dataReloadTime;

            vm.legend = data.legend;

            vm.houseManagementTypeList = vm.selectedHouseManagementTypes.length ?
                vm.selectedHouseManagementTypes : vm.houseManagementTypes;

            selectedResourceName = vm.munResourceNames[vm.selectedResourceCode];

            regionsData.forEach(putRegionData);

            vm.regions = regions;


            function putRegionData(data) {
                var value = intanPercent(data.mkdWithPuPercent),
                    region;

                if (!value) {
                    return;
                }

                region = regionsByCode[data.regionCode];

                region.value = value;
                region.fill =  data.color;

                angular.extend(region, {
                    mkdWithPuPercent: data.mkdWithPuPercent,
                    percentsByManagementType: data.percentsByManagementType,
                    mkdCount: data.mkdCount
                });
            }
        }

        function getHouseManagementTypeHeader() {
            if (vm.selectedHouseManagementTypes.length === 0) {
                return 'Выберите способ управления';
            }
            else if (vm.selectedHouseManagementTypes.length === vm.houseManagementTypes.length) {
                return 'Все способы управления';
            }
            else if (vm.selectedHouseManagementTypes.length > 1){
                return 'Выбранные способы управления';
            }
            else {
                return vm.selectedHouseManagementTypes[0].name;
            }
        }

        function getMkdCountMessage(mkdCount) {
            var message = publicStatisticNumeralCoherentText(mkdCount,
                'МКД размещен в Системе, в который',
                'МКД размещено в Системе, в которые',
                'МКД размещено в Системе, в которые') +

            ' поставляется ресурс «' + selectedResourceName + '»';

            if (selectedParams.constructionYearFrom || selectedParams.constructionYearTo) {
                message += ', при этом год ввода в эксплуатацию';

                if (selectedParams.constructionYearFrom) {
                    message += ' с ' + selectedParams.constructionYearFrom;
                }

                if (selectedParams.constructionYearTo) {
                    message += ' по ' + selectedParams.constructionYearTo;
                }
            }

            return message;
        }
    }
})(angular);

(function (angular) {
    calculationService.$inject = ["_", "intanPercent", "intanBigNumber"];
    angular.module('pafo-common-web-package')
        .service('publicStatisticRowsCalculationService', calculationService);

    /* @ngInject */
    function calculationService(_,intanPercent,intanBigNumber) {
        var service = this,
            bn = intanBigNumber;

        service.sum = function (data) {
            return _.reduce(data, function(sum, num) { return sum + num;} , 0);
        };

        service.sumFactory = function (projection) {
            var valueFunction = _.property(projection);
            return function (data) {
              return service.sum(data.map(valueFunction));
            };
        };

        service.percentFactory = function (value, total) {
            return function (data) {
                return intanPercent(value(data).toString(), total(data).toString());
            };
        };
        
        service.avgByCountFactory = function (projectionValue, projectionCount) {
            var valueFunction = _.property(projectionValue);
            var countFunction = _.property(projectionCount);
            return function (data) {
                var totalCount = service.sum (data.map(countFunction)),
                    sum = bnSum(data.map(function (x) {
                        return bn(valueFunction(x)).times(countFunction(x)).toNumber();
                    }));
                return sum.dividedBy(totalCount).round(3).toNumber();
            };
        };

        service.percentOverallConsumptionFactory = function (projection) {
            var valueFunc = _.property(projection);
            return function (data) {
                return intanPercent(valueFunc(data), data.avgOverallConsumption);
            };
        };

        service.percentTotalFactory = function (projection) {
            var valueFunc = _.property(projection);
            return function (data) {
                return intanPercent(valueFunc(data), data.avgTotal);
            };
        };

        function bnSum(data){
            return _.reduce(data, function(sum, num) { return sum.plus(num);} , bn(0));
        }
    }
})(angular);

(function (angular) {'use strict';
    angular.module('pafo-common-web-package')
        .directive('serviceProvidersDataTable', serviceProvidersDataTableDirective);

    function serviceProvidersDataTableDirective() {
        ServiceProvidersDataTableCtrl.$inject = ["$scope"];
        return {
            restrict: 'EA',
            replace: false,
            transclude: true,
            scope: {
                regions: '='
            },
            templateUrl: 'service-providers-data/components/service-providers-data-table.tpl.html',
            controller: ServiceProvidersDataTableCtrl,
            controllerAs: 'vm'
        };

        /* @ngInject */
        function ServiceProvidersDataTableCtrl($scope) {
            var vm = this;

            vm.sortKey = 'regionName';
            vm.sortAscending = true;
            vm.rowTemplates = [];
            vm.sort = sort;
            vm.sortIndicatorClass = sortIndicatorClass;

            $scope.$watch("regions", applySorting);

            function sortIndicatorClass(key) {
                var result = "";
                if (vm.sortKey === key) {
                    result = vm.sortAscending ? 'asc' : 'desc';
                }
                return result;
            }

            function sort(key) {
                vm.sortAscending = vm.sortKey === key ? !vm.sortAscending : true;
                vm.sortKey = key;
                applySorting();
            }

            function applySorting() {
                vm.sortedData = $scope.regions.data.sort(
                    function(a, b) {
                        var result = 0;
                        if (a[vm.sortKey] < b[vm.sortKey]) {
                            result = -1;
                        } else if (a[vm.sortKey] > b[vm.sortKey]) {
                            result = 1;
                        }
                        if (!vm.sortAscending) {
                            result = -result;
                        }
                        return result;
                    });
            }
        }
    }

}(angular));

(function (angular) {'use strict';
    serviceProvidersDataTableRowDirective.$inject = ["$filter"];
    angular.module('pafo-common-web-package')
        .directive('serviceProvidersDataTableRow', serviceProvidersDataTableRowDirective);

    /*@ngInject*/
    function serviceProvidersDataTableRowDirective($filter) {
        var numberFilter = $filter('number');
        return {
            restrict: 'EA',
            replace: false,
            require:'^serviceProvidersDataTable',
            scope: {
                header:'@',
                format: '&',
                width:'@'
            },
            compile:function () {
                return {
                    pre:function (scope, elem, attrs, table) {
                        var
                            key = attrs.key,
                            format = attrs.format? scope.format : function (x) {
                                return numberFilter( x.data);
                                },
                            rowTemplate = {
                                header: function () {
                                    return scope.header;
                                },
                                width: function () {
                                    return scope.width;
                                },
                                value: function (data) {
                                    if (data.noData === true ) {
                                        return '\u2013';
                                    }
                                    return format({data: data[key]});
                                },
                                key: key,
                                total: function (totals) {
                                    return format({data: totals[key]});
                                }
                            };
                        table.rowTemplates.push(rowTemplate);
                    }
                };
            }
        };
    }
}(angular));

(function (angular) {
    calculationService.$inject = ["publicStatisticRowsCalculationService", "_", "intanPercent"];
    angular.module('pafo-common-web-package')
        .service('ServiceProvidersDataTablesService', calculationService);
    /* @ngInject */
    function calculationService(publicStatisticRowsCalculationService, _, intanPercent) {
        var service = this,
            calcService = publicStatisticRowsCalculationService,
            avgByCountFactory = calcService.avgByCountFactory,
            sumFactory = calcService.sumFactory;

        service.tableStatistics = {
            AVG_CHARGED: {
                additional: function (data) {
                    return {
                        percentCharged: intanPercent(data.avgCharged, data.avgTotal)
                    };
                },
                totals: {
                    avgCharged: avgByCountFactory('avgCharged', 'documentsCountAvgTotal'),
                    avgTotal: avgByCountFactory('avgTotal', 'documentsCountAvgTotal'),
                    percentCharged: calcService.percentFactory(
                        avgByCountFactory('avgCharged', 'documentsCountAvgTotal'),
                        avgByCountFactory('avgTotal', 'documentsCountAvgTotal')
                    ),
                    documentsCountAvgTotal: sumFactory('documentsCountAvgTotal')
                }
            },
            AVG_INDIVIDUAL_CONSUMPTION: {
                additional: function (data) {return {
                    percentIndividualConsumption: intanPercent(data.avgIndividualConsumption, data.avgOverallConsumption)
                };},
                totals: {
                    avgIndividualConsumption: avgByCountFactory('avgIndividualConsumption','documentsCountAvgOverallConsumption'),
                    avgOverallConsumption: avgByCountFactory('avgOverallConsumption','documentsCountAvgOverallConsumption'),
                    percentIndividualConsumption: calcService.percentFactory(
                        avgByCountFactory('avgIndividualConsumption', 'documentsCountAvgOverallConsumption'),
                        avgByCountFactory('avgOverallConsumption', 'documentsCountAvgOverallConsumption')
                    ),
                    documentsCountAvgOverallConsumption: sumFactory('documentsCountAvgOverallConsumption')
                }
            },
            AVG_HOUSE_CONSUMPTION: {
                additional: function (data) {return {
                    percentHouseConsumption: intanPercent(data.avgHouseConsumption, data.avgOverallConsumption)
                };},
                totals: {
                    avgHouseConsumption: avgByCountFactory('avgHouseConsumption','documentsCountAvgHouseConsumption'),
                    avgOverallConsumption: avgByCountFactory('avgOverallConsumption','documentsCountAvgHouseConsumption'),
                    percentHouseConsumption: calcService.percentFactory(
                        avgByCountFactory('avgHouseConsumption', 'documentsCountAvgHouseConsumption'),
                        avgByCountFactory('avgOverallConsumption', 'documentsCountAvgHouseConsumption')
                    ),
                    documentsCountAvgHouseConsumption: sumFactory('documentsCountAvgHouseConsumption')
                }
            },
            AVG_UNIT_COST: {
                totals: {
                    avgServiceUnitCost: avgByCountFactory('avgServiceUnitCost', 'documentsCountAvgServiceUnitCost'),
                    documentsCountAvgServiceUnitCost: sumFactory('documentsCountAvgServiceUnitCost')
                }
            },
            AVG_TARIFF: {
                totals: {
                    avgTariff: avgByCountFactory('avgTariff', 'documentsCountAvgTariff'),
                    documentsCountAvgTariff: sumFactory('documentsCountAvgTariff')
                }
            }
        };

        service.fillDataForTable = function (statisticsTypeCode, data) {
            var strategy = service.tableStatistics[statisticsTypeCode],
                result = {};
            result.data = data.map(function (region) {
                angular.copy(region);
                if(strategy.additional) {
                    angular.extend(region, strategy.additional(region));
                }
                return region;
            });
            result.totals = _.mapValues(strategy.totals, function (value, key) {
                return value(result.data);
            });
            return result;
        };
    }
})(angular);

(function (angular) {'use strict';
    ServiceProvidersDataCtrl.$inject = ["$state", "intanMoment", "publicStatisticServiceProvidersDataRest", "publicStatisticNumeralCoherentText", "publicStatisticError", "MapData", "publicStatisticMonthYears", "intanPercent", "intanMunicipalResource", "publicStatisticRowsCalculationService", "intanRegionsService", "INTAN_ALL_REGIONS", "ServiceProvidersDataTablesService"];
    angular.module('pafo-common-web-package')
        .controller('ServiceProvidersDataCtrl', ServiceProvidersDataCtrl);

    /* @ngInject */
    function ServiceProvidersDataCtrl($state, intanMoment, publicStatisticServiceProvidersDataRest,
        publicStatisticNumeralCoherentText, publicStatisticError, MapData, publicStatisticMonthYears, intanPercent,
        intanMunicipalResource,publicStatisticRowsCalculationService,intanRegionsService, INTAN_ALL_REGIONS, ServiceProvidersDataTablesService) {

        var vm = this,
            MAX_SELECTED_REGIONS = 16,
            selectedRegions = [],
            monthYears = getMonthYears(),
            calcService = publicStatisticRowsCalculationService,
            HOT_WATER_SERVICE_CODE = '2',
            M_CUBE_UNITS = 'м\u00B3',
            munServices = [
                {
                    code: '1',
                    name: 'Холодное водоснабжение',
                    houseConsumptionAvailable: true,
                    units: M_CUBE_UNITS
                },
                {
                    code: HOT_WATER_SERVICE_CODE,
                    name: 'Горячее водоснабжение',
                    houseConsumptionAvailable: true,
                    units: M_CUBE_UNITS
                },
                {
                    code: '4',
                    name: 'Электроснабжение',
                    houseConsumptionAvailable: true,
                    units: 'кВт·ч'
                },
                {
                    code: '5',
                    name: 'Газоснабжение',
                    houseConsumptionAvailable: false,
                    units: M_CUBE_UNITS
                },
                {
                    code: '6',
                    name: 'Отопление',
                    houseConsumptionAvailable: false,
                    units: 'Гкал'
                },
                {
                    code: '3',
                    name: 'Отведение сточных вод',
                    houseConsumptionAvailable: true,
                    units: M_CUBE_UNITS
                },
                {
                    code: '7',
                    name: 'Обращение с твердыми коммунальными отходами',
                    houseConsumptionAvailable: false,
                    units: M_CUBE_UNITS
                }
            ],
            serviceUnits = munServices.reduce(function (map, service) {map[service.code] = service.units; return map;}, {}),
            munResources = intanMunicipalResource(),
            resourceUnits = munResources.reduce(function (map, resource) {map[resource.code] = resource.units; return map;}, {}),
            selectedParams = {},
            regionsData,
            totalAverageStats,
            legends;

        vm.pageTitle = $state.current.data.pageTitle;
        vm.breadcrumbs = $state.current.data.breadcrumbs;

        vm.munServiceNames = munServices.reduce(function (map, service) {
            map[service.code] = service.name; return map;
        }, {});

        vm.monthYears = monthYears.list();
        vm.selectedMonthYear = vm.monthYears[0];

        vm.statisticType = {
            AVG_CHARGED: {
                code: 'AVG_CHARGED',
                valueParam: 'avgCharged',
                documentsParam: 'documentsCountAvgTotal',
                getDocumentsText: getPremiseDocumentsText,
                totalAverageIcon: 'whhg-value-coins',
                totalAverageDescription: 'Средняя величина начисления по услуге',
                getUnits: function () {return 'руб.';},
                getDetails: function (data) {return {
                    avgCharged: data.avgCharged,
                    avgTotal: data.avgTotal,
                    percentCharged:  intanPercent(data.avgCharged, data.avgTotal),
                    documentsCountAvgTotal: data.documentsCountAvgTotal
                };},
                totals:{
                    avgCharged: calcService.avgByCountFactory('avgCharged', 'documentsCountAvgTotal'),
                    avgTotal: calcService.avgByCountFactory('avgTotal', 'documentsCountAvgTotal'),
                    percentCharged: calcService.percentFactory(
                        calcService.avgByCountFactory('avgCharged', 'documentsCountAvgTotal'),
                        calcService.avgByCountFactory('avgTotal', 'documentsCountAvgTotal')
                    ),
                    documentsCountAvgTotal: calcService.sumFactory('documentsCountAvgTotal')
                }
            },
            AVG_INDIVIDUAL_CONSUMPTION: {
                code: 'AVG_INDIVIDUAL_CONSUMPTION',
                valueParam: 'avgIndividualConsumption',
                totalAverageIcon: 'whhg-counter',
                documentsParam: 'documentsCountAvgOverallConsumption',
                getDocumentsText: getPremiseDocumentsText,
                totalAverageDescription: 'Среднее индивидуальное потребление по услуге',
                getUnits: function () {return serviceUnits[vm.selectedServiceCode];},
                getDetails: function (data) {return {
                    avgIndividualConsumption: data.avgIndividualConsumption,
                    avgOverallConsumption: data.avgOverallConsumption,
                    percentIndividualConsumption: intanPercent(data.avgIndividualConsumption, data.avgOverallConsumption),
                    documentsCountAvgOverallConsumption: data.documentsCountAvgOverallConsumption
                };}
            },
            AVG_HOUSE_CONSUMPTION: {
                code: 'AVG_HOUSE_CONSUMPTION',
                valueParam: 'avgHouseConsumption',
                documentsParam: 'documentsCountAvgOverallConsumption',
                getDocumentsText: getPremiseDocumentsText,
                totalAverageIcon: 'whhg-counter',
                totalAverageDescription: 'Среднее потребление на общедомовые нужды по услуге',
                getUnits: function () {return serviceUnits[vm.selectedServiceCode];},
                getDetails: function (data) {return {
                    avgHouseConsumption: data.avgHouseConsumption,
                    avgOverallConsumption: data.avgOverallConsumption,
                    percentHouseConsumption: intanPercent(data.avgHouseConsumption, data.avgOverallConsumption),
                    documentsCountAvgHouseConsumption: data.documentsCountAvgHouseConsumption
                };}
            },
            AVG_UNIT_COST: {
                code: 'AVG_UNIT_COST',
                valueParam: 'avgServiceUnitCost',
                documentsParam: 'documentsCountAvgServiceUnitCost',
                getDocumentsText: getServiceDocumentsText,
                totalAverageIcon: 'whhg-value-coins',
                totalAverageDescription: 'Средняя стоимость за единицу услуги',
                getUnits: function () {
                    return 'руб./' + (isTwoComponentTariff() ? resourceUnits[vm.selectedResourceCode] :
                    serviceUnits[vm.selectedServiceCode]);
                },
                getDetails: function (data) {
                    return {
                        avgServiceUnitCost: data.avgServiceUnitCost,
                        documentsCountAvgServiceUnitCost: data.documentsCountAvgServiceUnitCost
                    };
                }
            },
            AVG_TARIFF: {
                code: 'AVG_TARIFF',
                valueParam: 'avgTariff',
                documentsParam: 'documentsCountAvgTariff',
                getDocumentsText: getServiceDocumentsText,
                totalAverageIcon: 'whhg-value-coins',
                totalAverageDescription: 'Средний тариф по услуге',
                getUnits: function () {
                    return 'руб./' + (isTwoComponentTariff() ? resourceUnits[vm.selectedResourceCode] :
                    serviceUnits[vm.selectedServiceCode]);
                },
                getDetails: function (data) {return {
                    avgTariff: data.avgTariff,
                    documentsCountAvgTariff: data.documentsCountAvgTariff
                    };
                }
            }
        };
        vm.selectedStatisticType = vm.statisticType.AVG_CHARGED;
        vm.isStatisticType = isStatisticType;
        vm.isCostStatistic = isCostStatistic;
        vm.beforeJuly2017 = beforeJuly2017;

        vm.avgHouseConsumptionAvailable = function () {
            return munServices.some(function (service) {
                return service.code === vm.selectedServiceCode && service.houseConsumptionAvailable;
            });
        };

        vm.tariffType = {
            ONE_COMPONENT: 'ONE_COMPONENT',
            TWO_COMPONENT: 'TWO_COMPONENT'
        };
        vm.selectedTariffType = vm.tariffType.ONE_COMPONENT;
        vm.isTariffType = isTariffType;
        vm.isSelectedHotWaterService = isSelectedHotWaterService;
        vm.twoComponentTariffAvailable = twoComponentTariffAvailable;
        vm.isTwoComponentTariff = isTwoComponentTariff;

        vm.munResourceNames = munResources.reduce(function (map, resource) {map[resource.code] = resource.name; return map;}, {});
        vm.munResourceAvailable = function () {return twoComponentTariffAvailable() && isTwoComponentTariff();};
        vm.isTwoComponentTariffResource = isTwoComponentTariffResource;

        vm.regionSelectOptions =  {
            showSelectAllButton: false,
            enableRequiredFieldFeature: true,
            enableMergeSelectedChoice: true,
            data: {text: function(option) {return option.name;}},
            id: function(option) {return option.code;},
            formatResult: function(option) {return option.name;},
            formatSelection: function(option) {return option.name;}
        };
        vm.selectRegion = selectRegion;
        vm.selectRegions = selectRegions;

        /** Наведение указателя мыши на регион */
        vm.specifyRegion = function (region) {vm.specifiedRegion = region;};

        vm.getData = getData;
        vm.getResourceData = getResourceData;

        vm.getDocumentsText = getDocumentsText;

        getData();

        //#region functions
        function getMonthYears() {
            var start = intanMoment('2016-07', 'YYYY-MM').startOf('month'),
                end = intanMoment().startOf('month').subtract(1, 'months'),
                monthYears = [];

            while (start.isBefore(end)) {
                monthYears.unshift({
                    month: start.month() + 1,
                    year: start.year()
                });
                start.add(1, 'months');
            }

            return publicStatisticMonthYears(monthYears);
        }

        function isStatisticType(statisticType) {
            return vm.selectedStatisticType === statisticType;
        }

        function isCostStatistic() {
            return vm.isStatisticType(vm.statisticType.AVG_TARIFF) || vm.isStatisticType(vm.statisticType.AVG_UNIT_COST);
        }

        function isTariffType() {
            return isStatisticType(vm.statisticType.AVG_UNIT_COST) || isStatisticType(vm.statisticType.AVG_TARIFF);
        }

        function twoComponentTariffAvailable() {
            return isSelectedHotWaterService() && isTariffType() && vm.munResourceCodes.length;
        }

        function isSelectedHotWaterService() {
            return vm.selectedServiceCode === HOT_WATER_SERVICE_CODE;
        }

        function isTwoComponentTariff() {
            return isTariffType() && vm.selectedTariffType === vm.tariffType.TWO_COMPONENT;
        }

        function isTwoComponentTariffResource() {
            return isTwoComponentTariff() && vm.selectedResourceCode;
        }

        function isSingle() {
            return selectedRegions.length === 1;
        }

        function isAllRegions() {
            return isSingle() && selectedRegions[0] === INTAN_ALL_REGIONS;
        }

        function indexOfRegion(regions, regionCode) {
            if (regions === undefined) {
                return -1;
            }
            return regions.map(function (region) {
                return region.code;
            }).indexOf(regionCode);
        }

        function setRegions(regionsFromBackend) {
            vm.regionSelectOptions.data.results = intanRegionsService.getRegions(regionsFromBackend, true);
            vm.regionSelectOptions.data.results = vm.regionSelectOptions.data.results.filter(
                function (x) { return x.code != '99'; } //удаляем Байконур: PFOANALYST-26
            );
            if (!selectedRegions) {
                selectedRegions = [];
            }
            // Убрать из списка выбранных регионов те регионы, которые отсутствуют в новой выборке
            for (var i = 0; i < selectedRegions.length; i++) {
                if (indexOfRegion(vm.regionSelectOptions.data.results, selectedRegions[i].code) === -1) {
                    selectedRegions.splice(i, 1);
                    i--;
                }
            }
            if (!selectedRegions.length) {
                selectedRegions.push(INTAN_ALL_REGIONS);
            }
            vm.selectedRegions = selectedRegions;
        }

        /** Щелчок мышью по региону на карте */
        function selectRegion(region) {
            if (indexOfRegion(vm.selectedRegions, region.id) === -1) {
                if (vm.selectedRegions === undefined) {
                    vm.selectedRegions = [];
                } else {
                    vm.selectedRegions = angular.copy(vm.selectedRegions);
                }
                vm.selectedRegions.push({code:region.id, name:region.name});
                selectRegions();
            }
        }

        /** Изменение выбора в мульти-селекте со списком регионов */
        function selectRegions() {
            if (vm.selectedRegions) {
                var allRegionsIndex = indexOfRegion(vm.selectedRegions, INTAN_ALL_REGIONS.code);
                if (vm.selectedRegions.length > 1 && allRegionsIndex !== -1) {
                    if (indexOfRegion(selectedRegions, INTAN_ALL_REGIONS.code) === -1) {
                        // В список регионов добавили "Все регионы". Надо очистить список, оставив только "Все регионы"
                        vm.selectedRegions = [INTAN_ALL_REGIONS];
                    }
                    else {
                        // В список регионов, в котором были "Все регионы", добавили еще один регион. Надо убрать из списка "Все регионы"
                        vm.selectedRegions.splice(allRegionsIndex, 1);
                    }
                }
                if (vm.selectedRegions.length > MAX_SELECTED_REGIONS) {
                    vm.selectedRegions.splice(0, 1);
                }
            }
            if (angular.equals(vm.selectedRegions, selectedRegions)) {
                return;
            }
            selectedRegions = vm.selectedRegions;
            applyRegionsFilter();
        }

        function applyRegionsFilter() {
            var filteredRegionsData = [];
            if(vm.selectedRegions && vm.selectedRegions.length > 0) {
                if (isAllRegions()) {
                    filteredRegionsData = regionsData;
                } else {
                    filteredRegionsData = regionsData.filter(function (regionData) {
                        return vm.selectedRegions.some(function (selectedRegion) {return selectedRegion.code === regionData.regionCode;});
                    });
                }
            }
            vm.tableRegionsData = ServiceProvidersDataTablesService.fillDataForTable(vm.selectedStatisticType.code, filteredRegionsData);
        }

        function beforeJuly2017(){
            var selectedMonthYearPair = monthYears.pair(vm.selectedMonthYear);
            if(selectedMonthYearPair && selectedMonthYearPair.year && selectedMonthYearPair.month){
                var year = selectedMonthYearPair.year;
                var month = selectedMonthYearPair.month;
                return (year == 2017 && month < 7) || year < 2017;
            }
            return false;
        }

        function getData() {
            var selectedMonthYearPair, params;

            if (!isStatisticType(vm.statisticType.AVG_HOUSE_CONSUMPTION)) {
                vm.munServiceCodes = munServices.map(function (service) {return service.code;});
            }
            else {
                vm.munServiceCodes = munServices.filter(function (service) {
                    return service.houseConsumptionAvailable;
                }).map(function (service) {return service.code;});
            }

            if (!vm.selectedServiceCode) {
                vm.selectedServiceCode = vm.munServiceCodes[0];
            }


            if (!twoComponentTariffAvailable() || !isTwoComponentTariff()) {
                vm.selectedResourceCode = '';
            }

            if (twoComponentTariffAvailable() && isTwoComponentTariff() && !vm.selectedResourceCode) {
                vm.selectedResourceCode = vm.munResourceCodes[0];
            }

            if (!vm.selectedResourceCode) {
                vm.selectedTariffType = vm.tariffType.ONE_COMPONENT;
            }

            selectedMonthYearPair = monthYears.pair(vm.selectedMonthYear);

            if (selectedParams.month === selectedMonthYearPair.month &&
                selectedParams.year === selectedMonthYearPair.year &&
                selectedParams.serviceCode === vm.selectedServiceCode &&
                selectedParams.resourceCode === vm.selectedResourceCode) {

                displayData();
                return;
            }

            selectedParams = {
                month: selectedMonthYearPair.month,
                year: selectedMonthYearPair.year,
                serviceCode: vm.selectedServiceCode,
                resourceCode: vm.selectedResourceCode
            };

            params = {
                month: selectedParams.month,
                year: selectedParams.year,
                serviceCode: selectedParams.serviceCode
            };

            if (selectedParams.resourceCode) {
                params.resourceCode = selectedParams.resourceCode;
            }

            publicStatisticServiceProvidersDataRest.getData(params).then(setData, publicStatisticError);
        }

        function getResourceData() {
            //prevent unnecessarily call select2 ng-change
            if (vm.selectedResourceCode) {
                getData();
            }
        }

        function setData(data) {
            vm.date = data.dataReloadTime;
            totalAverageStats = data.stats;
            legends = data.legends;
            vm.munResourceCodes = munResources
                .filter(function (resource) {
                    return data.resourceCodes.some(function (code) {return resource.code === code;});
                })
                .map(function (resource) {return resource.code;});
            setRegions(data.serviceProviderDataList);

            regionsData = data.serviceProviderDataList;
            displayData();
        }

        function displayData() {
            var regions,
                regionsByCode;

            if (!legends || !regionsData.length) {
                vm.units = null;
                vm.legend = null;
                vm.totalAverageDescription = null;
                vm.hasData = false;
                vm.regions = [];
                return;
            }

            vm.hasData = true;
            vm.units = vm.selectedStatisticType.getUnits();
            vm.totalAverage = totalAverageStats[vm.selectedStatisticType.code];
            vm.legend = legends[vm.selectedStatisticType.code];
            vm.totalAverageDescription = vm.selectedStatisticType.totalAverageDescription;

            regions = angular.copy(MapData);
            regions = regions.filter(function(x){return x.id != '99';}); //удаляем Байконур: PFOANALYST-26
            regionsByCode = regions.reduce(function(map, region) {map[region.id] = region; return map;}, {});
            regionsData.forEach(putRegionData);
            vm.regions = regions;

            applyRegionsFilter();

            vm.selectedServiceName = vm.munServiceNames[vm.selectedServiceCode];

            if (isTwoComponentTariff()) {
                vm.selectedResourceName = vm.munResourceNames[vm.selectedResourceCode];
            }

            $state.current.data.regionsData = regionsData;


            function putRegionData(data) {
                var region, value,
                    documents = data[vm.selectedStatisticType.documentsParam];

                if (!documents) {
                    return;
                }

                region = regionsByCode[data.regionCode];
                value = data[vm.selectedStatisticType.valueParam];

                region.value = value;
                region.fill = data.colors[vm.selectedStatisticType.code];

                region[vm.selectedStatisticType.valueParam] = value;

                region.documents = documents;

                angular.extend(region, vm.selectedStatisticType.getDetails(data));
            }
        }

        function getTotalDocuments(regionsData, statisticType) {
            return regionsData.map(function (data) {return data[statisticType.documentsParam];})
                .reduce(function (prev, next) {return prev + next;});
        }

        function getDocumentsText(documents) {
            return vm.selectedStatisticType.getDocumentsText(documents);
        }

        function getPremiseDocumentsText(documents) {
            return publicStatisticNumeralCoherentText(documents,
                ' помещение, в которое в выбранном расчетном периоде предоставлялась услуга «' +
                vm.selectedServiceName + '», участвовало в расчете',
                ' помещения, в которые в выбранном расчетном периоде предоставлялась услуга «' +
                vm.selectedServiceName + '», участвовали в расчете',
                ' помещений, в которые в выбранном расчетном периоде предоставлялась услуга «' +
                vm.selectedServiceName + '», участвовали в расчете');
        }

        function getServiceDocumentsText(documents) {
            return publicStatisticNumeralCoherentText(documents,
                ' услуга в платежных документах участвовала в расчете',
                ' услуги в платежных документах участвовали в расчете',
                ' услуг в платежных документах участвовали в расчете');
        }
        //#endregion
    }
})(angular);

(function (angular) {'use strict';
    serviceProvidersDataRest.$inject = ["publicStatisticWidgetRestResource"];
    angular.module('pafo-common-web-package')
        .factory('publicStatisticServiceProvidersDataRest', serviceProvidersDataRest);

    /* @ngInject */
    function serviceProvidersDataRest(publicStatisticWidgetRestResource) {
        var widget = createRestResources();

        return {getData: widget.serviceProvidersData.get};


        function createRestResources() {
            return {
                serviceProvidersData: publicStatisticWidgetRestResource('/service-provider-data?month=:month&year=:year' +
                    '&statisticType=:statisticType&resourceCode=:resourceCode&serviceCode=:serviceCode')
            };
        }
    }
})(angular);

(function (angular) {'use strict';
    publicStatisticError.$inject = ["commonDialogs", "$log", "$q"];
    angular.module('pafo-common-web-package')
        .factory('publicStatisticError', publicStatisticError);

    /* @ngInject */
    function publicStatisticError(commonDialogs, $log, $q) {
        return function (err) {
            commonDialogs.error('Во время работы системы произошла ошибка.');
            $log.debug(err);
            return $q.reject('PUBLIC STATISTIC ERROR');
        };
    }
})(angular);

(function (angular) {'use strict';
    intanAppInfo.$inject = ["$location"];
    angular.module('pafo-common-web-package')
        .factory('intanAppInfo', intanAppInfo);

    /* @ngInject */
    function intanAppInfo($location) {
        return {
            isOrganizationCabinet: isOrganizationCabinet
        };

        function isOrganizationCabinet() {
            return $location.absUrl().toLowerCase().indexOf('/organization-cabinet/#!/') > -1;
        }
    }
}(angular));

(function (angular) {'use strict';
    intanBagelChartDirective.$inject = ["intanD3", "$window", "$document", "$timeout"];
    angular.module('pafo-common-web-package')
        .directive('intanBagelChart', intanBagelChartDirective);

    /**
     * @param sizes - массив массивов. Задетются массив длины на 1 больше чем количество колец в редиме.
     * Массивы указываются по порядку начиная с размерности 2, далее размерность 3 и т.д.
     * В данных массивах указывается пропорция ширин колец. "Дырка" считается за кольцо
     * @example
     * например, [[2,5],[2,3,4]] означает что 2x - ширина дырки, 3х - ширина 1го кольца, 4х - второго. x = radius / ( 2 + 3 + 4 )
     * [2,5] - массив для варианта с 1м кольцом
     * **/
    /* @ngInject */
    function intanBagelChartDirective(intanD3, $window, $document, $timeout) {
        var d3 = intanD3;
        return {
            restrict: 'E',
            replace: false,
            scope: {
                radius: '@',
                data: '=',
                sizes: '=',
                onMouseOver: '&',
                onMouseOut: '&',
                onClick: '&',
                tooltipId: '@'
            },
            link: link
        };

        function link(scope, element) {
            var radius = parseInt(scope.radius, 10),
                width = radius * 2,
                height = width,
                tooltipId,
                sizes,
                tooltipElem,
                hideTimeout,
                canvas = createCanvas(),
                partition = d3.layout.partition()
                    .size([2 * Math.PI, radius ])
                    .value(function(d) { return d.value; }),
                arc = d3.svg.arc()
                    .startAngle(function(d) { return d.x; })
                    .endAngle(function(d) { return d.x + d.dx; })
                    .innerRadius(function(d) { return getRadius(d.depth - 1); })
                    .outerRadius(function(d) { return getRadius(d.depth); });

            canvas.append('svg:circle').attr('r', radius).style('opacity', 0);

            if (scope.tooltipId) {
                tooltipId = '#' + scope.tooltipId;
                element.bind('mousemove', mouseMove);
            }

            scope.$watch(function () {return scope.data;}, display);

            function getRadius(depth){
                return  getSum(sizes.slice(0, depth+1));
            }

            function computeSizes(data) {
                var sizes = scope.sizes? scope.sizes : [],
                    size = totalDepth(data);

                return computeSize(findSize());

                function findSize() {
                    var item;
                    item = sizes.filter(function (item) {
                        return item.length === size;
                    })[0];
                    if(item === undefined){
                        item = Array.apply(null, {length: size}).map(function(){return 10;});
                    }
                    return item;
                }

                function computeSize(item) {
                    var sum = getSum(item);
                    var multiplicator = radius/sum;
                    return item.map(function (x) { return x * multiplicator;});
                }

                function totalDepth(data) {
                    return reqursion(data,1);
                    function reqursion(node,depth) {
                        if(!node.children) {
                            return depth;
                        }
                        return  Math.max.apply(null, node.children.map(function (c) {
                            return reqursion(c, depth+1);
                        }));
                    }
                }
            }

            function createCanvas() {
                return d3.select(element[0]).append('svg:svg')
                    .attr('width', width)
                    .attr('height', height)
                    .append('svg:g')
                    .attr('id', 'container')
                    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
            }

            function display(data) {
                var nodes, path;

                sizes = computeSizes(data);

                if (tooltipId) {
                    tooltipElem = angular.element(tooltipId);

                    if (tooltipElem) {
                        initTooltip();
                    }
                }

                if (!data) {
                    return;
                }

                canvas.selectAll('path').remove();

                nodes = partition.nodes(data).filter(function(d) {return (d.dx > 0.005 && d.depth > 0);});

                path = canvas.data([data]).selectAll('path').data(nodes);

                path.enter()
                    .append('svg:path')
                    .attr('d', arc)
                    .style('cursor', 'pointer')
                    .style('stroke', '#ffffff')
                    .attr('fill-rule', 'evenodd')
                    .style('fill', function(d) { return d.color; })
                    .style('opacity', 1)
                    .each(stash)
                    .transition()
                    .duration(750)
                    .attrTween('d', arcTween)
                    .each('end', function() {
                        d3.select(this)
                            .on('mouseover', mouseover)
                            .on('mouseleave', mouseleave)
                            .on('click', click);
                    });
            }

            function arcTween(a) {
                var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
                return function(t) {
                    var b = i(t);
                    a.x0 = b.x;
                    a.dx0 = b.dx;
                    return arc(b);
                };
            }

            function stash(d) {
                d.x0 = 0;
                d.dx0 = 0;
            }

            function click(d) {scope.$apply(function () {clickSector(d);});}

            function mouseover(d) {
                scope.$apply(function () {mouseOverSector(d);});

                var allPaths = canvas.selectAll('path');

                allPaths.interrupt().selectAll("*").interrupt();

                allPaths.transition().delay(0).style('opacity', 0.3);
                allPaths
                    .filter(function(node) {return (getAncestors(d).indexOf(node) >= 0);})
                    .transition().delay(0)
                    .style('opacity', 1);


                function getAncestors(node) {
                    var path = [],
                        current = node;

                    while (current.parent) {
                        path.unshift(current);
                        current = current.parent;
                    }

                    return path;
                }
            }

            function mouseleave(d) {
                scope.$apply(function () {mouseOutSector(d);});

                canvas.selectAll('path').transition().duration(1000).style('opacity', 1);
            }

            function mouseOverSector(sector) {
                if (scope.onMouseOver) {
                    scope.onMouseOver({data:sector});
                }

                if (tooltipElem) {
                    showTooltip();
                    $timeout.cancel(hideTimeout);
                }
            }

            function mouseOutSector() {
                if (scope.onMouseOut) {
                    scope.onMouseOut();
                }

                if (tooltipElem) {
                    hideTimeout = $timeout(hideTooltip);
                }
            }

            function clickSector(sector) {
                if (scope.onClick) {
                    scope.onClick({data:sector});
                }
            }

            function mouseMove(e) {
                if (tooltipElem) {
                    positionTooltip(e.pageX, e.pageY);
                }
            }

            function initTooltip() {
                tooltipElem.css('position', 'fixed');
                tooltipElem.css('top', 'auto');
                hideTooltip();
            }

            function hideTooltip() {
                tooltipElem.css('display', 'none');
            }

            function showTooltip() {
                tooltipElem.css('display', 'block');
            }

            function positionTooltip(pageX, pageY) {
                var radius = parseInt(scope.radius, 10),
                    elementRect = element[0].getBoundingClientRect(),
                    left = pageX - $window.pageXOffset,
                    leftMiddle = elementRect.left + radius,
                    documentHeight = $document[0].documentElement.clientHeight,
                    bottom = documentHeight - (pageY - $window.pageYOffset),
                    bottomMiddle = documentHeight - (elementRect.bottom - radius);

                if (left < leftMiddle) {
                    left = pageX - tooltipElem[0].clientWidth - $window.pageXOffset;
                }

                left = left < leftMiddle ? left - 5 : left + 15;

                if (bottom < bottomMiddle) {
                    bottom = documentHeight - (pageY + tooltipElem[0].clientHeight - $window.pageYOffset);
                }

                bottom = bottom < bottomMiddle ? bottom - 30 : bottom + 10;

                tooltipElem.css('bottom', bottom);
                tooltipElem.css('left', left);
            }
        }

        function getSum(item) {
            return item.reduce(function (pv, cv) {
                return pv + cv;
            }, 0);
        }
    }
}(angular));

(function (angular) {
    'use strict';
    intanBarChartDirective.$inject = ["intanD3", "$window", "$document", "$timeout"];
    angular.module('pafo-common-web-package')
        .directive('intanBarChart', intanBarChartDirective);

    /* @ngInject */
    function intanBarChartDirective(intanD3, $window, $document, $timeout) {
        var d3 = intanD3;
        var Colors = {
            grey: '#eaedf4'
        };

        return {
            restrict: 'E',
            replace: false,
            scope: {
                data: '=',
                options: '=',
                onMouseOver: '=',
                onMouseOut: '=',
                onClick: '=',
                tooltipId: '@'
            },
            link: link
        };

        function link(scope, element, attrs) {
            var defaultOptions = {
                    width: 1170,
                    height: 542,
                    margin: {
                        top: 50,
                        right: 30,
                        bottom: 150,
                        left: 50
                    },
                    class: '',
                    title: {
                        label: ""
                    },
                    axes: {
                        color: '#a2a2a2',
                        x: {
                            label: "",
                            splitLabels: false,
                            labelOffset: 0
                        },
                        y: {
                            label: "",
                            labelOffset: 0
                        }
                    },
                    showBarLabel: true,
                    verticalBarLabel: false,
                    maxValue: 100,
                    selectionColor: '#fe285b'
                },
                colors = d3.scale.category10(),
                maxYValue,
                data = [],
                labels = [],
                svg,
                canvas;

            var options = merge({
                width: attrs.width,
                height: attrs.height
            }, scope.options, defaultOptions);

            var labelBarHeight = options.showBarLabel ? 50 : 0;
            var bottomGape = 6;

            var plotArea = {
                position: {
                    x: 0,
                    y: 0
                },
                size: {
                    width: 0,
                    height: 0
                },
                yAxisTicks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                scaleX: null,
                scaleY: null,
                panel: null,


                barWidth: function () {
                    var BAR_WIDTH_RATE = 0.90;
                    return plotArea.scaleX.rangeBand() * BAR_WIDTH_RATE;
                },

                applyAxisLineStyles: function (selection) {
                    selection
                        .style('fill', 'none')
                        .style('stroke', '#d8dcdf')
                        .style('stroke-width', '1');
                },

                drawAxes: function () {

                    var xAxis = d3.svg.axis()
                        .scale(plotArea.scaleX)

                        .orient("bottom");

                    var yAxis = d3.svg.axis()
                        .scale(plotArea.scaleY)
                        .ticks(10)
                        .tickSize(5, 0)
                        .orient("left");

                    var yAxisLines = d3.svg.axis()
                        .scale(plotArea.scaleY)
                        .ticks(10)
                        .tickSize(plotArea.size.width, 0)
                        .orient("right");


                    var axesGroup = plotArea.panel.append('g')
                        .attr('fill', options.axes.color);

                    var xAxisGroup = axesGroup.append("g")
                        .attr("class", "x_axis")
                        .attr("transform", "translate(-1," + (plotArea.size.height + labelBarHeight + bottomGape * 2) + ")")
                        .call(xAxis);

                    xAxisGroup.selectAll("text")
                        .data(data)
                        .attr("y", 0)
                        .attr("dy", '0.5em')
                        .attr("x", -10)
                        .attr("transform", "rotate(-65)")
                        .style("text-anchor", "end")



                        //to create empty bars
                        .text(function (d) {

                            if (d.hasOwnProperty('labelText')) {
                                return d.labelText;
                            }
                            return d.label;
                        });

                    xAxisGroup.selectAll('path').remove();

                    var yAxesGroup = axesGroup.append("g")
                        .attr("class", "y_axis")
                        .attr("transform", "translate(0,0)")
                        .call(yAxis);

                    yAxesGroup.selectAll("text")
                        .attr("x", -13);

                    //yAxesGroup.selectAll('path').call(plotArea.applyAxisLineStyles);
                    //yAxesGroup.selectAll('line').call(plotArea.applyAxisLineStyles);

                    var yAxesLinesGroup = axesGroup.append("g")
                        .attr("class", "y_axis")
                        .attr("transform", "translate(0,0)")
                        .call(yAxisLines);

                    yAxesLinesGroup.selectAll('line')
                        .style("stroke-dasharray", ("2, 1"))
                        .attr('fill', Colors.grey)
                        .call(plotArea.applyAxisLineStyles);

                    yAxesLinesGroup.selectAll('path').remove();
                    yAxesLinesGroup.selectAll('text').remove();
                },

                drawBars: function () {
                    var barContainer,
                        barText,
                        barWidth = plotArea.barWidth();
                    data.map(function (d) {
                        return d.value;
                    });
                    barContainer = plotArea.panel.selectAll(".barContainer")
                        .data(data)
                        .enter()
                        .append("g")
                        .attr("id", function (d) {
                            return d.id;
                        })
                        .attr("class", "barContainer")
                        .attr("transform", function (d) {
                            return "translate(" + plotArea.scaleX(d.label) + ",0)";
                        })
                        .attr("width", barWidth)
                        .attr("height", function () {
                            return plotArea.size.height + barWidth + bottomGape;
                        });

                    barContainer.append("rect")
                        .attr("class", "greyBar")
                        .attr("fill", Colors.grey)
                        .attr("opacity", "0.5")
                        .attr("x", -barWidth * 0.11)
                        .attr("width", barWidth * 1.22)
                        .attr("visibility", "hidden")
                        .attr("height", plotArea.size.height);

                    barContainer
                        .filter(function (item, index) {return index != data.length - 1;})
                        .append("line")
                        .attr('x1', barWidth * 1.11)
                        .attr('x2', barWidth * 1.11)
                        .attr('y1', 0)
                        .attr('y2', plotArea.size.height)
                        .style('stroke-dasharray', ("2, 1"))
                        .style('stroke', Colors.grey)
                        .call(plotArea.applyAxisLineStyles);

                    barContainer.append('rect')
                        .attr("class", "bar")
                        .attr("fill", function (d) {
                            if (d.hasOwnProperty('barColor')) {
                                return d.barColor;
                            }
                            return colors(d.label);
                        })
                        .attr("fill-opacity", "85%")
                        .attr("width", barWidth)
                        .attr("y", function (d) {
                            return plotArea.scaleY(d.value);
                        })
                        .attr("height", function (d) {
                            return plotArea.size.height - plotArea.scaleY(d.value);
                        })
                        .on('mouseover', function (d) {
                            if (!d.value) {
                                return;
                            }

                            plotArea.showLegend(d);
                            applyMouseOver(d);
                        })
                        .on('mouseout', function (d) {
                            plotArea.hideLegend(d);
                            applyMouseOut(d);
                        })
                        .on('click', applyClick);

                    if (options.showBarLabel) {
                        barContainer.append("rect")
                            .attr("class", "barLabel")
                            .attr("fill", Colors.grey)
                            .attr("width", barWidth)
                            .attr("y", plotArea.size.height + bottomGape)
                            .attr("height", labelBarHeight);

                        barText = barContainer.append("text")
                            .attr("fill", '#a0a0a0')
                            .text(function (d) {
                                return d.value !== undefined && d.value !== null ? d.value : '';
                            });

                        if (options.verticalBarLabel) {
                            barText.attr("text-anchor", "middle")
                                .attr("x", -(plotArea.size.height + labelBarHeight / 2))
                                .attr("dx", "-0.35em")
                                .attr("y", barWidth / 2)
                                .attr("dy", "0.35em")
                                .attr("transform", "rotate(-90)");
                        }
                        else {
                            barText.attr("text-anchor", "middle")
                                .attr("dx", barWidth / 2)
                                .attr("y", plotArea.size.height + labelBarHeight / 2)
                                .attr("dy", "0.70em");
                        }
                    }
                },

                showLegend: function (data) {
                    var selectedBar = d3.select('#' + data.id);
                    selectedBar.select(".greyBar")
                        .attr("visibility", "visible");
                    selectedBar.select(".bar")
                        .attr("fill", options.selectionColor);
                    selectedBar.select(".barLabel")
                        .attr("fill", options.selectionColor);
                    selectedBar.select("text")
                        .attr("fill", '#ffffff');


                    if (options.legendMessage) {


                        var lineHeight = 27;
                        var leftMargin = 50;

                        var legendAreaPanel = plotArea.panel.append('g')
                            .attr("id", "legendArea");

                        var lines = options.legendMessage.split('\n');
                        lines.forEach(function (entry, index) {
                            legendAreaPanel.append('text')
                                .text(entry)
                                .attr('fill', '#515151')
                                .attr('dy', '1em')
                                .attr('y', function () {
                                    return lineHeight * index;
                                })
                                .attr('text-anchor', 'start');
                        });
                        var blockHeight = legendAreaPanel.node().getBBox().height;

                        legendAreaPanel.append('text')
                            .text(data.label)
                            .attr('fill', '#515151')
                            .attr('class', 'label')
                            .attr('y', blockHeight)
                            .attr('dy', '1em')
                            .attr('text-anchor', 'start');

                        blockHeight = legendAreaPanel.node().getBBox().height;

                        legendAreaPanel.append('text')
                            .text(data.value + '%')
                            .attr('fill', options.selectionColor)
                            .attr('class', 'value')
                            .attr('y', blockHeight)
                            .attr('dy', '1em')
                            .attr('text-anchor', 'start');

                        blockHeight = legendAreaPanel.node().getBBox().height;
                        legendAreaPanel
                            .attr("transform", "translate(" + (plotArea.size.width + leftMargin) + "," +
                                (plotArea.size.height / 2 - blockHeight / 2) + ")");
                    }
                },

                hideLegend: function (data) {
                    var selectedBar = d3.select('#' + data.id);
                    selectedBar.select(".greyBar")
                        .attr("visibility", "hidden");
                    selectedBar.select(".bar")
                        .attr("fill", function () {
                            if (data.hasOwnProperty('barColor')) {
                                return data.barColor;
                            }
                            return colors(data.label);
                        });
                    selectedBar.select(".barLabel")
                        .attr("fill", "#eaedf4");
                    selectedBar.select("text")
                        .attr("fill", '#a0a0a0');
                    d3.select('#legendArea').remove();
                },


                splitLabels: function () {
                    if (!scope.options.axes || !scope.options.axes.x.splitLabels) {
                        return;
                    }

                    var insertLinebreaks = function (d) {
                        var el = d3.select(this);
                        var words = d.label.split(' ');
                        el.text('');

                        for (var i = 0; i < words.length; i++) {
                            var tspan = el.append('tspan').text(words[i]);
                            if (i > 0) {
                                tspan.attr('x', 0).attr('dy', '15');
                            }
                        }
                    };
                    svg.selectAll('g.x.axis g text').each(insertLinebreaks);
                },

                prepare: function () {
                    plotArea.panel = svg.append("g")
                        .attr("transform", "translate(" + plotArea.position.x + "," + plotArea.position.y + ")");
                },

                render: function () {
                    plotArea.panel.selectAll('*').remove();

                    plotArea.scaleX = d3.scale.ordinal().rangeRoundBands([0, plotArea.size.width], 0.1);
                    plotArea.scaleX.domain(labels);

                    plotArea.scaleY = d3.scale.linear().range([plotArea.size.height, 0]);
                    plotArea.scaleY.domain([0, maxYValue]);

                    plotArea.panel.append('rect', ':first-child')
                        .attr("class", "whiteBar")
                        .attr("fill", "#fff")
                        .attr("x", 2)
                        .attr("width", plotArea.size.width-4)
                        .attr("height", plotArea.size.height);


                    plotArea.drawAxes();
                    plotArea.drawBars();

                    plotArea.splitLabels();
                }
            };

            canvas = d3.select(element[0])
                .append("div")
                .style("position", "relative");

            options.width = element.attr('width') || options.width;
            options.height = element.attr('height') || options.height;

            if (options.class) {
                canvas.classed(options.class, true);
            }

            canvas.style({
                "min-width": options.width + 'px',
                "width": options.width + 'px',
                "height": options.height + 'px',
                "min-height": options.height + 'px',
                "position": "relative"
            });

            svg = canvas.append('svg');

            var legendArea = 240;
            plotArea.position.x = options.margin.left;
            plotArea.position.y = options.margin.top;
            plotArea.size.width = (options.width - plotArea.position.x - options.margin.left - (options.legendMessage? legendArea: 0));
            plotArea.size.height = options.height - plotArea.position.y - options.margin.bottom;
            plotArea.prepare();

            var g = svg.append('g').classed('labels', true)
                .attr('transform', 'translate(0,' + (options.showBarLabel ? 0 : -50) + ')')
                .attr('text-anchor', 'middle');

            g.append('text')
                .text(options.axes.y.label)
                .attr('dy', '1em')
                .attr('transform', 'translate(0, ' + options.height / 2 + ')rotate(-90)');

            drawXLabel(g, options);

            scope.$watch('data', function () {
                maxYValue = d3.max(scope.data, function (d) {
                    return d.value;
                });

                maxYValue = maxYValue * 1.2;

                if (maxYValue === 0) {
                    maxYValue = options.maxValue;
                }

                data = scope.data;
                labels = scope.data.map(function (d) {
                    return d.label;
                });

                plotArea.render();
            });


            scope.$watch('options', function (newValue, oldValue) {
                if (angular.equals(newValue, oldValue)) {
                    return;
                }

                var options = merge({
                    width: attrs.width,
                    height: attrs.height
                }, newValue, defaultOptions);


                svg.select('g.labels').remove();
                var g = svg.append('g').classed('labels', true)
                    .attr('transform', 'translate(0,' + (options.showBarLabel ? 0 : -50) + ')')
                    .attr('text-anchor', 'middle');

                var labelText = g.append('text')
                    .attr('dy', '1em')
                    .attr('transform', 'translate(0, ' + options.height / 2 + ')rotate(-90)');
                //Clean text from html tags like <sup></sup>
                var labelY = String(options.axes.y.label).replace(/<[^>]+>/gm, '');
                labelText.text(labelY)
                    .attr('x', options.axes.y.labelOffset);
                drawXLabel(g, options);
            }, true);

            var tooltipId, tooltipElem, hideTimeout;

            if (scope.tooltipId) {
                tooltipId = '#' + scope.tooltipId;
                element.bind('mousemove', mouseMove);
            }

            if (tooltipId) {
                tooltipElem = angular.element(tooltipId);

                if (tooltipElem) {
                    initTooltip();
                }
            }
            function drawXLabel(g, options) {
                var offset = options.axes.x.labelOffset?options.axes.x.labelOffset:Math.round(options.width / 2);
                g.append('text')
                    .attr('x',  offset+ "px")
                    .attr('y', (options.height - 5) + "px")
                    .text(options.axes.x.label);
            }

            function applyMouseOver(d) {
                scope.$apply(function () {
                    mouseOver(d);
                });
            }

            function applyMouseOut(d) {
                scope.$apply(function () {
                    mouseOut(d);
                });
            }

            function applyClick(d) {
                scope.$apply(function () {
                    click(d);
                });
            }

            function mouseOver(d) {
                if (scope.onMouseOver) {
                    scope.onMouseOver(d);
                }

                if (tooltipElem) {
                    showTooltip();
                    $timeout.cancel(hideTimeout);
                }
            }

            function mouseOut(d) {
                if (scope.onMouseOut) {
                    scope.onMouseOut(d);
                }

                if (tooltipElem) {
                    hideTimeout = $timeout(hideTooltip, 100);
                }
            }

            function click(d) {
                if (scope.onClick) {
                    scope.onClick(d);
                }
            }

            function mouseMove(e) {
                if (!tooltipElem) {
                    return;
                }

                tooltipElem.css('left', e.pageX - Math.round(tooltipElem[0].clientWidth / 2) - $window.pageXOffset);
                tooltipElem.css('bottom', $document[0].documentElement.clientHeight - (e.pageY - $window.pageYOffset) + 20);
            }

            function initTooltip() {
                tooltipElem.css('position', 'fixed');
                tooltipElem.css('top', 'auto');
                hideTooltip();
            }

            function hideTooltip() {
                tooltipElem.css('display', 'none');
            }

            function showTooltip() {
                tooltipElem.css('display', 'block');
            }
        }

        function merge(dst) {

            for (var i = arguments.length; i > 0; i--) {
                var obj = arguments[i];

                angular.forEach(obj, _merge);
            }

            return dst;

            function _merge(value, key) {
                if (dst[key] && dst[key].constructor && dst[key].constructor === Object) {
                    merge(dst[key], value);
                } else {
                    dst[key] = angular.copy(value);
                }
            }
        }
    }
}(angular));

(function (angular, BigNumber) {'use strict';
    angular.module('pafo-common-web-package')
        .factory('intanBigNumber', intanBigNumber);

    function intanBigNumber() {
        return function (value, base) {
            return new BigNumber(value, base);
        };
    }
}(angular, BigNumber));

(function (angular, d3) {'use strict';
    angular.module('pafo-common-web-package')
        .factory('intanD3', intanD3);

    function intanD3() {
        return d3;
    }
}(angular, d3));

(function (angular) {'use strict';
    angular.module('pafo-common-web-package')
        .directive('intanGridAsideHeader', intanGridAsideHeaderDirective);

    function intanGridAsideHeaderDirective() {
        return {
            restrict: 'A',
            replace: false,
            link: function(scope, elem) {
                var parent = elem.parent(),
                    cells = elem.find('th');

                scope.$watch(function() {return parent.height();}, function(newHeight) {
                    cells.css('height', newHeight + 'px');
                });
            }
        };
    }
}(angular));

(function (angular) {'use strict';
    angular.module('pafo-common-web-package')
        .directive('intanGridScroll', intanGridScrollDirective);

    function intanGridScrollDirective() {
        var scrollLeft = 0;

        return {
            restrict: 'A',
            replace: false,
            compile: function(elem, attrs) {
                syncScroll(elem.find('.' + attrs.intanGridScroll));
            }
        };

        function syncScroll(elements) {
            elements.on('scroll', function (e) {
                if (e.isTrigger) {
                    e.target.scrollLeft = scrollLeft;
                }
                else {
                    scrollLeft = e.target.scrollLeft;
                    elements.each(function (i) {
                        var elem = elements[i];

                        if (!elem.isSameNode(e.target)) {
                            angular.element(elem).trigger('scroll');
                        }
                    });
                }
            });
        }
    }
}(angular));

(function (angular) {'use strict';
    intanGroupBarChartDirective.$inject = ["intanD3", "intanSvgText"];
    angular.module('pafo-common-web-package')
        .directive('intanGroupBarChart', intanGroupBarChartDirective);

    /* @ngInject */
    function intanGroupBarChartDirective(intanD3,intanSvgText) {
        var d3 = intanD3;

        return {
            restrict: 'E',
            replace: false,
            scope: {
                data: '=',
                options: '=',
                mouseOver: '=',
                mouseOut: '='
            },
            link: link
        };

        function link(scope, element, attrs) {
            var defaultOptions = {
                    width: 1170,
                    height: 542,
                    margin: {
                        top: 50,
                        right: 30,
                        bottom: 150,
                        left: 50
                    },
                    bottomGape: 6,
                    barGape: 10,
                    innerGape:8,
                    labelBarHeight: 45,
                    class: '',
                    title: {
                        label: ""
                    },
                    axes: {
                        color: '#a2a2a2',
                        x: {
                            label: "",
                            splitLabels:false,
                            labelOffset: 0
                        },
                        y: {
                            label: "",
                            labelOffset: 0
                        }
                    },
                    barItem: {
                        verticalLabel: false
                    }
                },
                colors = d3.scale.category10(),
                maxYValue,
                data = [],
                labels = [],
                svg,
                canvas;

            var options = merge({
                width: attrs.width,
                height: attrs.height
            }, scope.options, defaultOptions);


            var plotArea = {
                position: {
                    x: 0,
                    y: 0
                },
                size: {
                    width: 0,
                    height: 0
                },
                yAxisTicks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                scaleX: null,
                scaleY: null,
                panel: null,


                barWidth: function(){

                    return plotArea.scaleX.rangeBand() - options.barGape;
                },

                applyAxisLineStyles: function (selection) {
                    selection
                        .style('fill', 'none')
                        .style('stroke', '#d8dcdf')
                        .style('stroke-width', '1');
                },

                drawAxes: function () {

                    var xAxis = d3.svg.axis()
                        .scale(plotArea.scaleX)
                        .orient("bottom");

                    var yAxis = d3.svg.axis()
                        .scale(plotArea.scaleY)
                        .ticks(10)
                        .tickSize(5, 0)
                        .orient("left");

                    var yAxisLines = d3.svg.axis()
                        .scale(plotArea.scaleY)
                        .ticks(10)
                        .tickSize(plotArea.size.width, 0)
                        .orient("right");


                    var axesGroup = plotArea.panel.append('g')
                        .attr('fill', options.axes.color);

                    var xAxisGroup = axesGroup.append("g")
                        .attr("class", "x_axis")
                        .attr("transform", "translate(-1," + (plotArea.size.height + options.labelBarHeight + options.bottomGape * 2) + ")")
                        .call(xAxis);

                    xAxisGroup.selectAll("text").remove();

                    xAxisGroup.selectAll('path').remove();

                    var yAxesGroup = axesGroup.append("g")
                        .attr("class", "y_axis")
                        .attr("transform", "translate(0,0)")
                        .call(yAxis);

                    yAxesGroup.selectAll("text")
                        .attr("font-size", '20px')
                        .attr("x", -13);

                    yAxesGroup.selectAll('path').call(plotArea.applyAxisLineStyles);
                    yAxesGroup.selectAll('line').call(plotArea.applyAxisLineStyles);

                    var yAxesLinesGroup = axesGroup.append("g")
                        .attr("class", "y_axis")
                        .attr("transform", "translate(0,0)")
                        .call(yAxisLines);

                    yAxesLinesGroup.selectAll('line')
                        .style("stroke-dasharray", ("3, 1"))
                        .attr('fill', "#ededed" )
                        .call(plotArea.applyAxisLineStyles);

                    yAxesLinesGroup.selectAll('path').remove();
                    yAxesLinesGroup.selectAll('text').remove();
                },

                drawBars: function () {
                    var text,
                        barContainer = plotArea.panel.selectAll(".barContainer")
                        .data(data)
                        .enter()
                        .append("g")
                        .attr("id", function (d) {
                            return d.id ;
                        })
                        .attr("class", "barContainer")
                        .attr("transform",function(d){
                            return  "translate(" + plotArea.scaleX(d.label) + ",0)";
                        })
                        .attr("width", plotArea.barWidth())
                        .attr("height", function () {
                            return plotArea.size.height + plotArea.barWidth() + options.bottomGape ;
                        })
                        .on('mouseover', plotArea.showTip)
                        .on('mouseout', plotArea.hideTip);


                    barContainer.append("rect")
                        .attr("class", "greyBar")
                        .attr("fill",'#eaedf4')
                        .attr("fill-opacity", "70%")
                        .attr("width", plotArea.barWidth())
                        .attr("height", plotArea.size.height);


                    barContainer.append("rect")
                        .attr("class", "barLabel")
                        .attr("fill",'#eaedf4')
                        .attr("fill-opacity", "0.85")
                        .attr("width", plotArea.barWidth())
                        //find other way to get gape between bars
                        .attr("y", plotArea.size.height + options.bottomGape)
                        .attr("height", options.labelBarHeight);


                    text = barContainer.append("text")
                        .attr("class", "barLabelText")
                        .attr("fill", '#a0a0a0')
                        .attr("dy", "0.35em")
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "middle")
                        .text(function (d) {
                            if (!d.label){
                                return '';
                            } else {
                                return d.label;
                            }
                        });
                    intanSvgText.wrap(text, plotArea.barWidth());
                    text.selectAll('tspan').attr("x", plotArea.barWidth() / 2);
                    text.each( function(){
                        var textItem = d3.select(this);
                        textItem .attr("y", plotArea.size.height + (options.labelBarHeight - textItem .node().getBBox().height)/2 + options.bottomGape);
                    });

                    var barItem = barContainer.selectAll(".barItem")
                        .data(function(d){
                            return d.data;
                        })
                        .enter().append("g")
                        .attr("class", "barItem")
                        .attr("transform",function(dt, i, j){
                            return  "translate(" + (options.innerGape + (plotArea.barWidth() - 2 * options.innerGape)*i/data[j].data.length) + ", 0)";
                        });

                    barItem.append("rect")
                        .attr("class", "dataBar")
                        .attr("fill", function (d) {
                            if (d.hasOwnProperty('barColor')) {
                                return d.barColor;
                            }
                            return colors(d.label);
                        })
                        .attr("fill-opacity", "0.80")
                        .attr("y", function(d){
                            return plotArea.scaleY(d.value);
                        })
                        .attr("height", function(dt){
                            return plotArea.size.height - plotArea.scaleY(dt.value) ;
                        })
                        .attr("width", function (d, i, j) {
                            return (plotArea.barWidth() - 2 * options.innerGape)/data[j].data.length;
                        });


                    var barItemText = barItem.append("text").text(function (d) {
                        if (!d.value){
                            return '';
                        } else {
                            return d.value;
                        }
                    });

                    if (options.barItem.verticalLabel) {
                        barItemText.attr("transform", "rotate(-90)")
                            .attr("x", - plotArea.size.height + options.bottomGape)
                            .attr("y", function () {
                                var barItemWidth = (plotArea.barWidth() - 2 * options.innerGape) /
                                    data[arguments[2]].data.length;

                                return options.innerGape + barItemWidth / 2;
                            });
                    }
                    else {
                        barItemText.attr("text-anchor", "middle")
                            .attr("x", function (d, i, j) {
                                return (plotArea.barWidth() - 2 * options.innerGape)/(2 * data[j].data.length);
                            })
                            .attr("y", plotArea.size.height - options.bottomGape);
                    }
                },

                showTip: function (eventData) {
                    if (scope.mouseOver) {
                        scope.$apply(function () {scope.mouseOver(eventData);});
                    }

                    var selectedBar = d3.select('#' + eventData.id);

                    selectedBar.selectAll(".dataBar").attr("fill",'#fe285b');

                    selectedBar.selectAll(".barItem").selectAll(".dataBar")
                        .attr("fill-opacity", function(d, i, j) {return 0.60 + 0.2 * j;});

                    selectedBar.select(".barLabel").attr("fill",'#fe285b');
                    selectedBar.select(".barLabelText").attr("fill",'#ffffff');
                },

                hideTip: function (eventData) {
                    if (scope.mouseOut) {
                        scope.$apply(function () {scope.mouseOut(eventData);});
                    }

                    var selectedBar = d3.select('#' + eventData.id);

                    selectedBar.select(".barLabel").attr("fill", "#eaedf4");
                    selectedBar.select(".barLabelText").attr("fill", '#a0a0a0');
                    selectedBar.selectAll(".dataBar").attr("fill-opacity", 0.80);
                    selectedBar.selectAll(".barItem").selectAll(".dataBar")
                        .attr("fill",function(d) {return d.barColor;});
                },

                splitLabels: function (){
                    if (!scope.options.axes || !scope.options.axes.x.splitLabels){
                        return;
                    }

                    var insertLinebreaks = function (d) {
                        var el = d3.select(this);
                        var words = d.label.split(' ');
                        el.text('');

                        for (var i = 0; i < words.length; i++) {
                            var tspan = el.append('tspan').text(words[i]);
                            if (i > 0) {
                                tspan.attr('x', 0).attr('dy', '15');
                            }
                        }
                    };
                    svg.selectAll('g.x.axis g text').each(insertLinebreaks);
                },

                prepare: function () {
                    plotArea.panel = svg.append("g")
                        .attr("transform", "translate(" + plotArea.position.x + "," + plotArea.position.y + ")");
                },

                render: function () {
                    plotArea.panel.selectAll('*').remove();

                    plotArea.scaleX = d3.scale.ordinal().rangeRoundBands([0, plotArea.size.width]);
                    plotArea.scaleX.domain(labels);

                    plotArea.scaleY = d3.scale.linear().range([plotArea.size.height, 0]);
                    plotArea.scaleY.domain([0, maxYValue]);

                    plotArea.drawAxes();
                    plotArea.drawBars();

                    plotArea.splitLabels();
                }
            };

            canvas = d3.select(element[0])
                .append("div")
                .style("position", "relative");

            options.width =element.attr('width') || options.width;
            options.height = element.attr('height') || options.height;

            if (options.class) {
                canvas.classed(options.class, true);
            }

            canvas.style({
                "min-width": options.width + 'px',
                "width": options.width + 'px',
                "height": options.height + 'px',
                "min-height": options.height + 'px',
                "position": "relative"
            });

            svg = canvas.append('svg');

            plotArea.position.x = options.margin.left;
            plotArea.position.y = options.margin.top;
            plotArea.size.width = options.width - plotArea.position.x - options.margin.left;
            plotArea.size.height = options.height - plotArea.position.y - options.margin.bottom;
            plotArea.prepare();

            var g = svg.append('g').classed('labels', true);

            g.append('text')
                .text(options.axes.y.label)
                .attr('text-anchor', 'middle')
                .attr('dy', '1em')
                .attr('transform', 'translate(0, ' + options.height / 2 + ')rotate(-90)');

            g.append('text')
                .attr('x', plotArea.size.width / 2)
                .attr('text-anchor', 'middle')
                .attr('y', (options.height - 5) + "px")
                .text(options.axes.x.label);

            scope.$watch('data', function () {
                maxYValue = d3.max(scope.data, function (d) {
                    return d3.max(d.data, function(d1){
                        return d1.value;
                    });
                });

                maxYValue = maxYValue * 1.2;

                data = scope.data;
                labels = scope.data.map(function (d) {
                    return d.label;
                });

                plotArea.render();
            });


            scope.$watch('options', function (newValue, oldValue) {
                if (angular.equals(newValue, oldValue)) {
                    return;
                }

                options = merge({
                    width: attrs.width,
                    height: attrs.height
                }, newValue, defaultOptions);


                svg.select('g.labels').remove();
                var g = svg.append('g').classed('labels', true)
                    .attr('text-anchor', 'middle');

                var labelText = g.append('text')
                    .attr('dy', '1em')
                    .attr('transform', 'translate(0, ' + options.height / 2 + ')rotate(-90)');
                //Clean text from html tags like <sup></sup>
                var labelY = String(options.axes.y.label).replace(/<[^>]+>/gm, '');
                labelText.text(labelY)
                    .attr('x',options.axes.y.labelOffset );

                g.append('text')
                    .attr('x', options.width / 2)
                    .attr('y', (options.height - 5) + "px")
                    .text(options.axes.x.label).attr('x',options.axes.x.labelOffset );
            }, true);
        }

        function merge(dst) {
            for (var i = arguments.length; i > 0; i--) {
                var obj = arguments[i];

                angular.forEach(obj, _merge);
            }

            return dst;

            function _merge(value, key) {
                if (dst[key] && dst[key].constructor && dst[key].constructor === Object) {
                    merge(dst[key], value);
                } else {
                    dst[key] = angular.copy(value);
                }
            }
        }
    }
}(angular));

(function (angular) {'use strict';
    angular.module('pafo-common-web-package')
        .factory('intanHouseManagementTypes', intanHouseManagementTypesFactory);

    function intanHouseManagementTypesFactory() {
        return function () {
            return [
                {code:'0', name:'Информация о способе управления не размещена в Системе'},
                {code:'1', name: 'Непосредственное управление'},
                {code:'2', name: 'ТСЖ'},
                {code:'3', name: 'ЖК'},
                {code:'4', name: 'Иной кооператив'},
                {code:'5', name: 'УО'},
                {code:'6', name: 'Не выбран'}
            ];
        };
    }
}(angular));

(function (angular) {'use strict';
    angular.module('pafo-common-web-package')
        .directive('intanInfoTooltip', intanInfoTooltipDirective);

    /* @ngInject */
    function intanInfoTooltipDirective() {
        return {
            restrict: 'E',
            scope: true,
            template: '<span class="app-icon app-icon_md app-icon_cl_prime whhg-info-sign"' +
                    'hcs-popover="" hcs-popover-hide-close-button="true"' +
                    'hcs-popover-template="{{tooltipId}}"' +
                    'hcs-popover-trigger="mouseenter"' +
                    'hcs-popover-theme="hcs-popover-tooltip-theme"' +
                    'hcs-popover-placement="top|center"' +
                    'hcs-popover-timeout="0"></span>',

            compile: function () {
                return {
                    pre: function (scope, tElem, tAttrs) {
                        scope.tooltipId = tAttrs.tooltipId;
                    }
                };
            }
        };
    }
}(angular));

(function (angular) {
    'use strict';
    intanMapDirective.$inject = ["$document", "$timeout", "intanD3"];
    angular.module('pafo-common-web-package')
        .directive('intanMap', intanMapDirective);

    /* @ngInject */
    function intanMapDirective($document, $timeout, intanD3) {
        var d3 = intanD3;
        return {
            restrict: 'E',
            scope: {
                regions: '=',
                onMouseOver: '=',
                onMouseOut: '=',
                onClick: '=',
                tooltipId: '@'
            },
            link: link,
            template: '<div></div>'
        };

        function link(scope, elem) {
            var mapElem = elem.children()[0],
                tooltipId,
                tooltipElem,
                hideTimeout,
                lastWidth;

            elem.on('mousemove', mouseMove);

            if (scope.tooltipId) {
                tooltipId = '#' + scope.tooltipId;
            }

            scope.$watch(function () {return scope.regions;}, display);

            function display(regions) {

                if (tooltipId) {
                    tooltipElem = angular.element(tooltipId);

                    if (tooltipElem) {
                        initTooltip();
                    }
                }

                if (!regions || !regions.length) {
                    return;
                }

                drawMap(regions);
            }

            function drawMap(regions) {
                var mapSize = getMapSize(),
                    canvas,
                    elements;

                elem.empty();

                canvas = d3.select(elem[0]).append('svg:svg')
                    .attr("viewBox", "10 0 620 420")
                    .attr('width', mapSize.width)
                    .attr('height', mapSize.height)
                    .append('svg:g');

                elements = canvas.selectAll('path').data(regions)
                    .enter()
                    .append('svg:path')
                    .attr('fill', function (region) {
                        return region.fill;
                    })
                    .attr('d', function (region) {
                        return region.path;
                    })
                    .attr('stroke', 'none')
                    .attr('id', function (region) {
                        return region.id;
                    })
                    .on('mouseover', mouseOverRegion)
                    .on('mouseleave', mouseOutRegion)
                    .on('click', clickRegion);

                function mouseOverRegion(region) {
                    if (scope.onMouseOver) {
                        scope.$apply(function () {
                            scope.onMouseOver(region);
                        });
                    }

                    elements
                        .filter(function (node) {
                            return node !== region;
                        })
                        .transition()
                        .delay(0)
                        .style('opacity', 0.5);

                    if (tooltipElem) {
                        showTooltip();
                        $timeout.cancel(hideTimeout);
                    }
                }

                function mouseOutRegion(region) {
                    if (scope.onMouseOut) {
                        scope.$apply(function () {
                            scope.onMouseOut(region);
                        });
                    }

                    elements.transition().duration(300).style('opacity', 1);
                    if (tooltipElem) {
                        hideTimeout = $timeout(hideTooltip, 100);
                    }
                }

                function clickRegion(region) {
                    if (scope.onClick) {
                        scope.$apply(function () {
                            scope.onClick(region);
                        });
                    }
                }
            }

            function getMapSize() {
                var width = mapElem && mapElem.clientWidth?mapElem.clientWidth:lastWidth,
                    aspectRatio = 1.7,
                    minWidth = 500;

                lastWidth = width;

                width = width > minWidth ? width : minWidth;

                return {
                    height: Math.ceil(width / aspectRatio),
                    width: width
                };
            }

            function mouseMove(e) {
                if (tooltipElem) {
                    tooltipElem.css('left', e.clientX - Math.round(tooltipElem[0].clientWidth / 2));
                    tooltipElem.css('bottom', $document[0].documentElement.clientHeight - (e.clientY));
                }
            }

            function initTooltip() {
                tooltipElem.css('position', 'fixed');
                tooltipElem.css('top', 'auto');
                hideTooltip();
            }

            function hideTooltip() {
                tooltipElem.css('display', 'none');
            }

            function showTooltip() {
                tooltipElem.css('display', 'block');
            }
        }
    }
}(angular));

(function (angular, moment) {'use strict';
    angular.module('pafo-common-web-package')
        .factory('intanMoment', intanMoment);

    function intanMoment() {
        return moment;
    }
}(angular, moment));

(function (angular) {'use strict';
    angular.module('pafo-common-web-package')
        .factory('intanMunicipalResource', intanMunicipalResourceFactory);

    function intanMunicipalResourceFactory() {
        var M_CUBE_UNITS = 'м\u00B3';


        return function (params) {
            var municipalResources = [
                {
                    code: '1',
                    name: 'Холодная вода',
                    meteringDevicesAvailable: true,
                    units: M_CUBE_UNITS
                },
                {
                    code: '2',
                    name: 'Горячая вода',
                    meteringDevicesAvailable: true,
                    units: M_CUBE_UNITS
                },
                {
                    code: '3',
                    name: 'Электрическая энергия',
                    meteringDevicesAvailable: true,
                    units: 'кВт·ч'
                },
                {
                    code: '4',
                    name: 'Газ',
                    meteringDevicesAvailable: true,
                    units: M_CUBE_UNITS
                },
                {
                    code: '5',
                    name: 'Тепловая энергия',
                    meteringDevicesAvailable: true,
                    units: 'Гкал'
                },
                {
                    code: '6',
                    name: 'Бытовой газ в баллонах',
                    meteringDevicesAvailable: false,
                    units: 'кг'
                },
                {
                    code: '7',
                    name: 'Твердое топливо',
                    meteringDevicesAvailable: false,
                    units: 'кг'
                },
                {
                    code: '8',
                    name: 'Сточные бытовые воды',
                    meteringDevicesAvailable: true,
                    units: M_CUBE_UNITS
                }
            ];

            if (params && (params.meteringDevicesAvailable === true || params.meteringDevicesAvailable === false)) {
                return municipalResources.filter(function (resource) {
                    return resource.meteringDevicesAvailable === params.meteringDevicesAvailable;
                });
            }

            return municipalResources;
        };
    }
}(angular));

(function (angular) {'use strict';
    intanPercentFilter.$inject = ["intanPercent"];
    angular.module('pafo-common-web-package')
        .filter('intanPercent', intanPercentFilter);

    // Фильтр ожидает на вход дробное значение, которое преобразуется в процентное значение.
    // По умолчанию добавляется знак процента и тире, если значение не является числом

    /* @ngInject */
    function intanPercentFilter(intanPercent) {

        return function(rate, precision, percentText, nanText) {

            if (!angular.isNumber(rate) || rate === Infinity) {
                return nanText === undefined ? '\u2013' : nanText;
            }

            return intanPercent(rate, undefined, precision).toFixed(precision) +
                (percentText === undefined ? '%' : percentText);
        };
    }
})(angular);

(function (angular) {'use strict';
    intanPercentFactory.$inject = ["intanBigNumber"];
    angular.module('pafo-common-web-package')
        .factory('intanPercent', intanPercentFactory);

    /* @ngInject */
    function intanPercentFactory(intanBigNumber) {

        return function (rate, total, precision, dontCheckForNan) {

            precision = precision === undefined ? 2 : precision;

            var result = total === undefined ?
                intanBigNumber(rate).times(100).round(precision).toNumber() :
                intanBigNumber(rate).times(100).dividedBy(total).round(precision).toNumber();
            if (!dontCheckForNan) {
                result = isNaN(result) ? 0 : result;
            }
            return result;
        };
    }
}(angular));

(function (angular) {'use strict';
    intanPieChartDirective.$inject = ["intanD3"];
    angular.module('pafo-common-web-package')
        .directive('intanPieChart', intanPieChartDirective);

    /* @ngInject */
    function intanPieChartDirective(intanD3) {
        var d3 = intanD3;

        return {
            restrict: 'E',
            replace: false,
            scope: {
                data: '=',
                options: '='
            },
            link: link
        };

        function link(scope, element, attrs) {
            var defaultOptions = {
                    width: 1000,
                    height: 270,
                    summaryAreaWidth : 250,
                    legendItemWidth: 170,
                    innerArcWidth: 25,
                    class: '',
                    title: {
                        label: ""
                    },
                    axes: {
                        color: '#a2a2a2',
                        x: {
                            label: ""
                        },
                        y: {
                            label: ""
                        }
                    },
                    drawLegend : true

                },
                colors = d3.scale.category10(),
                PIE_ITEM_CLASS = 'pie-item',
                LEGEND_ITEM_CLASS = 'pie-legend-item',
                total = 0,
                center,
                data = [],
                summary = {},
                tooltip,
                svg,
                canvas,
                offset;

            var options = merge({
                width: attrs.width,
                height: attrs.height

            }, scope.options, defaultOptions);

            var plotArea = {
                position: {
                    x: 0,
                    y: 0
                },
                size: {
                    width: 0,
                    height: 0
                },
                plotHeight: 0,
                plotWidth: 0,

                panel: null,
                pie: null,

                onSelect: function () {
                    selectItem(d3.select(this).attr('data-item-id'));
                },

                onSelectCancel: function () {
                    deselectItem(d3.select(this).attr('data-item-id'));
                },

                prepare: function () {
                    plotArea.pie = d3.layout.pie()
                        .value(function (d) {
                            return d.value;
                        })
                        .sort(null);

                    plotArea.panel = svg.append("g")
                        .attr("transform", "translate(" + plotArea.position.x + "," + plotArea.position.y + ")");
                },

                render: function () {
                    plotArea.panel.selectAll('*').remove();

                    if (!plotArea.pie) {
                        return;
                    }

                    var arc = getArc(center.x - offset);
                    var tooltipArc = getArc((center.x - offset)*2.2);

                    var piePanel = plotArea.panel.append('g')
                        .attr('transform', 'translate(' + (plotArea.size.width / 2) + ',' + (plotArea.size.height / 2) + ')');

                    var path = piePanel.selectAll('path')
                        .data(plotArea.pie(data))
                        .enter()
                        .append('path')
                        .attr('d', arc)
                        .attr('data-item-id', function (d, i) {
                            d._pie_item_id = i;
                            return i;
                        })
                        .attr('tooltip-position-x', function(d){
                            d.innerRadius = 0;
                            d.outerRadius = plotArea.size.width;
                            return tooltipArc.centroid(d)[0];
                        })
                        .attr('tooltip-position-y', function(d){
                            d.innerRadius = 0;
                            d.outerRadius = plotArea.size.width;
                            return tooltipArc.centroid(d)[1];
                        })
                        .attr('stroke', '#fff')
                        .attr('stroke-width', '2')
                        .attr('fill', function (datum) {
                            return datum.data.color || colors(datum.data.label);
                        })
                        .classed(PIE_ITEM_CLASS, true)
//                                .classed(SELECTABLE_ITEM_CLASS, true)
                        .each(function (d) {
                            this._current = d;
                        });

                    path.on('mouseover', plotArea.onSelect);
                    path.on('mouseout', plotArea.onSelectCancel);

                    path.on('touchstart', plotArea.onSelect);
                    path.on('touchend', plotArea.onSelectCancel);
                    path.on('touchcancel', plotArea.onSelectCancel);

                    var innerWidth = options.innerArcWidth;
                    var startOpacity = 0.25;

                    var sizeInScale = function (percent) {
                        return d3.scale.linear().domain([0, 100]).range([0, center.x - offset])(percent);
                    };

                    for (var innerCircleCnt = 1; innerCircleCnt <= 3; innerCircleCnt++) {
                        var innerCircle = d3.svg.arc()
                            .innerRadius(sizeInScale(innerWidth * (innerCircleCnt - 1)))
                            .outerRadius(sizeInScale(innerWidth * innerCircleCnt))
                            .startAngle(0)
                            .endAngle(2 * Math.PI);

                        piePanel.append('path')
                            .attr('d', innerCircle)
                            .style('fill', 'rgba(255,255,255,' + (startOpacity * (4 - innerCircleCnt)) + ')')
                            .style('pointer-events', 'none');
                    }
                },

                showTooltip: function (element, data) {
                    if (!data.tooltip || !element[0] || !element[0][0]){
                        return;
                    }

                    var x = Math.round(parseFloat(element[0][0].getAttribute('tooltip-position-x')));
                    var y = Math.round(parseFloat(element[0][0].getAttribute('tooltip-position-y')));

                    var centerX = plotArea.size.width / 2;// 100; //plotArea.position.x + plotArea.size.width / 2;
                    var centerY = plotArea.size.height / 2;// 100; //plotArea.position.y + plotArea.size.height /2;

                    var correctionX = tooltip.node().getBoundingClientRect().width / 2;
                    var correctionY = tooltip.node().getBoundingClientRect().height / 2;

                    tooltip.html("<div>" + data.tooltip + "</div>")
                        .style({
                            'z-index': 1,
                            left: centerX + x - correctionX +  'px',
                            top: centerY + y - correctionY + 'px'
                        })
                        .classed("active", true);
                },

                hideTooltip: function () {
                    tooltip.classed("active", false);
                }
            };

            var legendArea = {
                position: {
                    x: 0,
                    y: 0
                },
                size: {
                    width: 0,
                    height: 0
                },
                panel: null,

                getArc: function (outerRadius) {
                    return d3.svg.arc()
                        .innerRadius(0)
                        .outerRadius(outerRadius);
                },

                drawLegend: drawLegend,

                onSelect: function () {
                    selectItem(d3.select(this).attr('data-item-id'));
                },

                onSelectCancel: function () {
                    deselectItem(d3.select(this).attr('data-item-id'));
                },

                prepare: function () {
                    legendArea.panel = svg.append('g')
                        .attr("transform", "translate(" + legendArea.position.x + "," + legendArea.position.y + ")");
                },

                render: function () {
                    legendArea.panel.selectAll('*').remove();
                    legendArea.drawLegend();
                }
            };

            function selectItem(lineIndex) {
                var selectedPath = svg.selectAll('.' + PIE_ITEM_CLASS + '[data-item-id="' + lineIndex + '"]')
                    .classed('active', true)
                    .transition()
                    .duration(500)
                    .attrTween("d", arcTween(sizeInScale(105)));

                plotArea.showTooltip(selectedPath, data[lineIndex]);

                svg.selectAll('.' + PIE_ITEM_CLASS + ':not([data-item-id="' + lineIndex + '"])')
                    .attr('opacity', 0.5);

                svg.selectAll('.' + LEGEND_ITEM_CLASS+ ':not([data-item-id="' + lineIndex + '"])')
                    .transition()
                    .delay(50)
                    .style('opacity', 0.25);
            }

            function deselectItem(lineIndex) {
                plotArea.hideTooltip();

                svg.selectAll('.' + PIE_ITEM_CLASS + '[data-item-id="' + lineIndex + '"]')
                    .classed('active', false)
                    .transition()
                    .duration(500)
                    .attrTween("d", arcTween(sizeInScale(100)));

                svg.selectAll('.' + PIE_ITEM_CLASS+ ':not([data-item-id="' + lineIndex + '"])')
                    .attr('opacity', 1);

                svg.selectAll('.' + LEGEND_ITEM_CLASS+ ':not([data-item-id="' + lineIndex + '"])')
                    .transition()
                    .delay(50)
                    .style('opacity', 1);
            }

            var arcTween = function (outerRadius) {
                var arc = getArc(center.x - offset);
                return function (a) {
                    var i = d3.interpolate(this._current, a),
                        k = d3.interpolate(arc.outerRadius()(), outerRadius);
                    this._current = i(0);
                    return function (t) {
                        return arc.outerRadius(k(t))(i(t));
                    };
                };
            };

            var getArc = function (outerRadius) {
                return d3.svg.arc()
                    .innerRadius(0)
                    .outerRadius(outerRadius);
            };

            var sizeInScale = function (percent) {
                return d3.scale.linear().domain([0, 100]).range([0, center.x - offset])(percent);
            };

            canvas = d3.select(element[0])
                .append("div")
                .classed('pie-chart', true);

            options.width = element.attr('width') || options.width;
            options.height = element.attr('height') || options.height;

            var minDemension = Math.min(options.width / 2, options.height);
            center = {x: minDemension / 2, y: minDemension / 2};

            offset = minDemension * 0.05;

            canvas.style({
                "min-width": options.width + 'px',
                "width": options.width + 'px',
                "height": options.height + 'px',
                "min-height": options.height + 'px',
                "position": "relative"
            });

            if (options.class) {
                canvas.classed(options.class, true);
            }

            svg = canvas.append('svg');

            plotArea.position.x = 0;
            plotArea.position.y = 0;
            plotArea.size.width = (options.width - plotArea.position.x) * (options.drawLegend ? 0.30 : 1.0);
           // plotArea.size.width = options.height;
            plotArea.size.height = options.height - plotArea.position.y;
            plotArea.prepare();

            if (options.drawLegend) {
                legendArea.position.x = plotArea.size.width;
                legendArea.position.y = 0;
                legendArea.size.width = (options.width - legendArea.position.x) * 0.7;
                legendArea.size.height = options.height - legendArea.position.y;
                legendArea.prepare();
            }

            tooltip = canvas.append("div").classed("pie-chart-tooltip", true)
                .on('mouseover', function(){
                    d3.select(this).classed('active-over', true);
                })
                .on('mouseout', function(){
                    d3.select(this).classed('active-over', false);
                });

            scope.$watch('data', function () {
                if (!scope.data){
                    return;
                }

                data = scope.data.chart;
                summary = scope.data.summary;

                total = 0;
                for (var i = 0, I = data.length; i < I; i++) {
                    total += data[i].value;
                }

                plotArea.render();
                if (options.drawLegend) {
                    legendArea.render();
                }
            });


            function drawLegend() {
                var summaryAreaPanel,
                    messageLines,
                    legendAreaInnerPanel;

                if (summary) {
                    summaryAreaPanel = legendArea.panel.append('g');

                    summaryAreaPanel
                        .attr('transform', 'translate(0, ' + (legendArea.size.height * 0.9 / 2) + ')')
                        .attr('class', 'summary_area');

                    messageLines = summary.message.split('\n');

                    if (summary.messagePosition === 'top') {
                        drawSummaryArea(messageLines.reverse(), function (index) {return -24 * index;}, 50);
                    }
                    else {
                        drawSummaryArea(messageLines, function (index) {return index === 0 ? 30 : 30 + 24 * index;}, 0);
                    }
                }

                legendAreaInnerPanel = legendArea.panel.append('g');

                data.forEach(drawLegendItem);


                function drawSummaryArea(messageLines, messageLineY, valueY) {
                    var summaryAreaTotal;

                    messageLines.forEach(function (entry, index) {
                        summaryAreaPanel.append('text')
                            .text(entry)
                            .attr('y', function () {return messageLineY(index);})
                            .attr('text-anchor', 'start');
                    });

                    summaryAreaTotal = summaryAreaPanel.append('text')
                        .text(summary.total)
                        .attr('class', 'total')
                        .attr('y', valueY)
                        .attr('text-anchor', 'start');

                    summaryAreaPanel.append('text')
                        .text(summary.unit)
                        .attr('x', summaryAreaTotal.node().getBBox().width + 5)
                        .attr('y', valueY)
                        .attr('text-anchor', 'start');
                }

                function drawLegendItem(item, index) {
                    var legendItem, labelLines, labelHeight, tipValue;

                    legendItem = legendAreaInnerPanel.append('g')
                        .classed("legend-item", true)
                        .attr('data-item-id', index)
                        .attr("transform", "translate(" +
                        (options.summaryAreaWidth + options.legendItemWidth * index)  + ", " +
                        (legendArea.size.height * 0.93) / 2 +")");

                    legendItem.append('path')
                        .attr('d', legendArea.getArc(16).startAngle(0).endAngle(Math.PI * 2))
                        .style('fill', item.color || colors(item.label))
                        .attr("transform", "translate(28,-5)")
                        .attr('data-item-id', index)
                        .classed(LEGEND_ITEM_CLASS, true);

                    labelLines = item.label.split('\n');

                    labelLines.forEach(function(entry, num){
                        legendItem.append('text')
                            .text(entry)
                            .attr('x', 50)
                            .attr('y', num * 22)
                            .attr('text-anchor', 'start')
                            .attr('data-item-id', index)
                            .classed(LEGEND_ITEM_CLASS, true);
                    });

                    labelHeight = legendItem.node().getBBox().height;

                    legendItem.append('text')
                        .text((toPercent(item.value, total)||0) + '%')
                        .attr('x', 50)
                        .attr('y', labelHeight)
                        .attr('dy', '0.4em')
                        .attr('fill',  item.color || colors(item.label))
                        .attr('text-anchor', 'start')
                        .attr('data-item-id', index)
                        .classed("value", true)
                        .classed(LEGEND_ITEM_CLASS, true);

                    labelHeight = legendItem.node().getBBox().height;

                    if (item.tipValue) {
                        tipValue = legendItem.append('text')
                            .classed(LEGEND_ITEM_CLASS, true)
                            .attr('data-item-id', index)
                            .attr('x', 50)
                            .attr('y', labelHeight)
                            .attr('text-anchor', 'start');

                        tipValue.append('tspan')
                            .text(item.tipValue)
                            .classed("pie-legend-tip-value", true);

                        tipValue.append('tspan')
                            .text(item.tipUnit);
                    }

                    legendItem.on('mouseover', legendArea.onSelect);
                    legendItem.on('mouseout', legendArea.onSelectCancel);

                    legendItem.on('touchstart', legendArea.onSelect);
                    legendItem.on('touchend', legendArea.onSelectCancel);
                    legendItem.on('touchcancel', legendArea.onSelectCancel);

                    function toPercent(value, total) {
                        return Math.round(1000 * value / total) / 10;
                    }
                }
            }
        }

        function merge(dst) {
            for (var i = arguments.length; i > 0; i--) {
                var obj = arguments[i];

                angular.forEach(obj, _merge);
            }

            return dst;

            function _merge(value, key) {
                if (dst[key] && dst[key].constructor && dst[key].constructor === Object) {
                    merge(dst[key], value);
                } else {
                    dst[key] = angular.copy(value);
                }
            }
        }
    }
}(angular));

(function (angular) {
    regionsService.$inject = ["MapData", "_", "INTAN_ALL_REGIONS"];
    angular.module('pafo-common-web-package')
        .constant('INTAN_ALL_REGIONS', {code: 'RF', name: 'Все субъекты РФ'})
        .service('intanRegionsService', regionsService);
    /* @ngInject */
    function regionsService(MapData, _, INTAN_ALL_REGIONS) {
        var regions = _.chain(MapData).map(
            function(region){ return  {
                code: region.id,
                name: region.name
            };
        }).sortBy('name').value();

        /** Список регионов из статической карты app/components/map-data.js */
        this.getRegionsFromStaticMap = function (needAllRegionsRecord) {
            if (needAllRegionsRecord) {
                regions.unshift(INTAN_ALL_REGIONS);
            }
            return regions;
        };

        /** Список регионов на основании входного списка, полученного из ответа рест-сервиса */
        this.getRegions = function (regions, needAllRegionsRecord) {
            var result = _.chain(regions).map(
                function(region){ return  {
                    code: region.regionCode,
                    name: region.regionName
                };
                }).sortBy('name').value();

            if (needAllRegionsRecord) {
                result.unshift(INTAN_ALL_REGIONS);
            }
            return result;
        };
    }
}(angular));

angular.module('pafo-common-web-package')
    .directive('intanRzslider', ['$parse', '$timeout', function ($parse, $timeout) {
        return {
            restrict: 'AE',
            require: 'ngModel',
            //language=HTML
            template: '<rzslider rz-slider-tpl-url="shared/rzslider-custom/rzslider-custom.tpl.html"' +
            'rz-slider-model="modelMin" rz-slider-high="modelMax"  rz-slider-options="options">' +
            '</rzslider>',
            scope: {
                min: "@",
                max: "@",
                tickStep: "@",
                onStopSlide: "&"
            },
            link: function ($scope, element, attrs, ngModelCtrl) {
                var ticksArray,
                    currentYear = (new Date()).getFullYear();

                $scope.$watchCollection('[modelMin,modelMax]', function (p1, p2, p3) {
                    ngModelCtrl.$setViewValue(p1);
                });

                initSlider();

                $scope.$watchCollection('[min,max,tickStep]', function (p1, p2, p3) {
                    initSlider();
                });

                function getMin() {
                    return parseInt($scope.min, 10) || 1700;
                }

                function getMax() {
                    return parseInt($scope.min, 10) || currentYear;
                }

                function getTickStep() {
                    return parseInt($scope.tickStep, 10) || 50;
                }

                function updateValue() {
                    $scope.onStopSlide({});
                }

                ngModelCtrl.$render = function () {
                    if(ngModelCtrl.$viewValue && ngModelCtrl.$viewValue.length === 2) {
                        $scope.modelMin = ngModelCtrl.$viewValue[0];
                        $scope.modelMax = ngModelCtrl.$viewValue[1];
                    }
                };

                function initSlider() {
                    ticksArray = [];

                    for (var i = getMin(); i <= getMax(); i += getTickStep()) {
                        ticksArray.push(i);
                    }
                    if (ticksArray[ticksArray.length - 1] !== getMax()) {
                        ticksArray.push(getMax());
                    }
                    $scope.modelMin = getMin();
                    $scope.modelMax = getMax();
                    $scope.options = {
                        floor: getMin(),
                        ceil: getMax(),
                        mergeRangeLabelsIfSame: true,
                        showTicksValues: true,
                        ticksArray: ticksArray,
                        selectionBarGradient: {
                            from: '#0d6bef',
                            to: '#0db9f0'
                        },
                        onEnd: updateValue
                    };
                    ngModelCtrl.$setViewValue([getMin(), getMax()]);

                }

            }
        };
    }]);

angular.module('pafo-common-web-package')
    .directive('intanSlider', ['$parse', '$timeout', function ($parse, $timeout) {
        return {
            restrict: 'AE',
            replace: true,
            template: '<div class="intan-slider"><input class="slider-input" type="text" /></div>',
            require: 'ngModel',
            scope: {
                max: "=",
                min: "=",
                step: "=",
                value: "=",
                ngModel: '=',
                range:'=',
                sliderid: '=',
                formater: '&',
                onStartSlide: '&',
                onStopSlide: '&',
                onSlide: '&'
            },
            link: function ($scope, element, attrs, ngModelCtrl) {
                var ngModelDeregisterFn, ngDisabledDeregisterFn;

                initSlider();

                function initSlider() {
                    var options = {};

                    function setOption(key, value, defaultValue) {
                        options[key] = value || defaultValue;
                    }
                    function setFloatOption(key, value, defaultValue) {
                        options[key] = value ? parseFloat(value) : defaultValue;
                    }
                    function setBooleanOption(key, value, defaultValue) {
                        options[key] = value ? value + '' === 'true' : defaultValue;
                    }
                    function getArrayOrValue(value) {
                        return (angular.isString(value) && value.indexOf("[") === 0) ? angular.fromJson(value) : value;
                    }

                    setOption('id', $scope.sliderid);
                    setOption('orientation', attrs.orientation, 'horizontal');
                    setOption('selection', attrs.selection, 'before');
                    setOption('handle', attrs.handle, 'round');
                    setOption('tooltip', attrs.sliderTooltip, 'show');
                    setOption('tooltipseparator', attrs.tooltipseparator, ':');

                    setFloatOption('min', $scope.min, 0);
                    setFloatOption('max', $scope.max, 10);
                    setFloatOption('step', $scope.step, 1);
                    var strNbr = options.step + '';
                    var decimals = strNbr.substring(strNbr.lastIndexOf('.') + 1);
                    setFloatOption('precision', attrs.precision, decimals);

                    setBooleanOption('tooltip_split', attrs.tooltipsplit, false);
                    setBooleanOption('enabled', attrs.enabled, true);
                    setBooleanOption('naturalarrowkeys', attrs.naturalarrowkeys, false);
                    setBooleanOption('reversed', attrs.reversed, false);

                    setBooleanOption('range', $scope.range, false);
                    if( options.range ) {
                        if( angular.isArray($scope.value) ) {
                            options.value = $scope.value;
                        }
                        else if (angular.isString($scope.value)) {
                            options.value = getArrayOrValue($scope.value);
                            if(!angular.isArray(options.value)) {
                                var value = parseFloat($scope.value);
                                if( isNaN(value) ) {
                                    value = 5;
                                }

                                if( value < $scope.min ) {
                                    value = $scope.min;
                                    options.value = [value, options.max];
                                }
                                else if( value > $scope.max ) {
                                    value = $scope.max;
                                    options.value = [options.min, value];
                                }
                                else {
                                    options.value = [options.min, options.max];
                                }
                            }
                        }
                        else {
                            options.value = [options.min, options.max]; // This is needed, because of value defined at $.fn.slider.defaults - default value 5 prevents creating range slider
                        }
                        $scope.ngModel = options.value; // needed, otherwise turns value into [null, ##]
                    }
                    else {
                        setFloatOption('value', $scope.value, 5);
                    }

                    if ($scope.formater) {
                        options.formater = $scope.$eval($scope.formater);
                    }

                    var slider = $(element).find( ".slider-input" ).eq( 0 );

                    // check if slider jQuery plugin exists
                    if( $.fn.slider ) {
                        // adding methods to jQuery slider plugin prototype
                        $.fn.slider.Constructor.prototype.disable = function () {
                            this.picker.off();
                        };
                        $.fn.slider.Constructor.prototype.enable = function () {
                            this.picker.on();
                        };

                        // destroy previous slider to reset all options
                        slider.slider( options );
                        slider.slider( 'destroy' );
                        slider.slider( options );

                        // everything that needs slider element
                        var updateEvent = getArrayOrValue( attrs.updateevent );
                        if ( angular.isString( updateEvent ) ) {
                            // if only single event name in string
                            updateEvent = [updateEvent];
                        }
                        else {
                            // default to slide event
                            updateEvent = ['slide'];
                        }
                        angular.forEach( updateEvent, function ( sliderEvent ) {
                            slider.on( sliderEvent, function ( ev ) {
                                ngModelCtrl.$setViewValue( ev.value );
                                $timeout( function () {
                                    $scope.$apply();
                                } );
                            } );
                        } );

                        // Event listeners
                        var sliderEvents = {
                            slideStart: 'onStartSlide',
                            slide: 'onSlide',
                            slideStop: 'onStopSlide'
                        };
                        angular.forEach( sliderEvents, function ( sliderEventAttr, sliderEvent ) {
                            slider.on( sliderEvent, function ( ev ) {

                                if ( $scope[sliderEventAttr] ) {
                                    var invoker = $parse( attrs[sliderEventAttr] );
                                    invoker( $scope.$parent, {$event: ev, value: ev.value} );

                                    //custom - slider view
                                    //...

                                    $timeout( function () {
                                        $scope.$apply();
                                    } );
                                }
                            } );
                        } );

                        // deregister ngDisabled watcher to prevent memory leaks
                        if ( angular.isFunction( ngDisabledDeregisterFn ) ) {
                            ngDisabledDeregisterFn();
                            ngDisabledDeregisterFn = null;
                        }
                        if ( angular.isDefined( attrs.ngDisabled ) ) {
                            ngDisabledDeregisterFn = $scope.$watch( attrs.ngDisabled, function ( value ) {
                                if ( value ) {
                                    slider.slider( 'disable' );
                                }
                                else {
                                    slider.slider( 'enable' );
                                }
                            } );
                        }
                        // deregister ngModel watcher to prevent memory leaks
                        if ( angular.isFunction( ngModelDeregisterFn ) ) {
                            ngModelDeregisterFn();
                        }
                        ngModelDeregisterFn = $scope.$watch( 'ngModel', function ( value ) {
                            slider.slider( 'setValue', value );
                        } );
                    }
                }

                var watchers = ['min', 'max', 'step', 'range'];
                angular.forEach(watchers, function(prop) {
                    $scope.$watch(prop, function(){
                        initSlider();
                    });
                });
            }
        };
    }])
;

(function (angular) {
    intanSvgText.$inject = ["intanD3"];
    angular.module('pafo-common-web-package')
        .service('intanSvgText',intanSvgText);

    /* @ngInject */
    function intanSvgText(intanD3) {
        this.wrap = wrap;
        function wrap(text, width) {
            text.each(function() {
                var text = intanD3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width && line.length > 1) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", lineHeight + "em").text(word);
                    }
                }
            });
        }
    }
}(angular));

(function (angular) {'use strict';
    IntanTerritorySelectCtrl.$inject = ["$modalInstance", "params", "$ClassifierService", "publicStatisticError"];
    angular.module('pafo-common-web-package')
        .controller('IntanTerritorySelectCtrl', IntanTerritorySelectCtrl);

    /* @ngInject */
    function IntanTerritorySelectCtrl($modalInstance, params, $ClassifierService, publicStatisticError) {
        var vm = this;

        vm.division = {
            fias: 'fias', // ФИАС - Административно-территориальное деление
            oktmo: 'oktmo'// ОКТМО - Муниципальное деление
        };

        vm.selectedDivision = vm.division.fias;

        vm.fiasForm = {
            filter: {},
            fieldParams: {
                street: {hidden: true},
                house: {hidden: true},
                building: {hidden: true},
                struct: {hidden: true}
            }
        };

        if (params && params.regionAoGuid) {
            vm.fiasForm.filter.regionCode = params.regionAoGuid;
            vm.fiasForm.fieldParams.region = {disabled: true};
        }

        vm.oktmoForm = {
            searchParameters: {},
            showAllLevelConfig: {
                showCheckBox: false,
                allLevelValue: false
            },
            defaultSearchParameters: {},
            fieldParams: {}
        };

        if (params && params.regionOktmoCode) {
            vm.oktmoForm.searchParameters = {region: {code: params.regionOktmoCode}};
            vm.oktmoForm.fieldParams.region = {disabled: true};
        }

        vm.isFiasDivision = isFiasDivision;
        vm.isOktmoDivision = isOktmoDivision;
        vm.discard = discard;
        vm.selectAvailable = selectAvailable;
        vm.select = select;


        function isFiasDivision() {
            return vm.selectedDivision === vm.division.fias;
        }

        function isOktmoDivision() {
            return vm.selectedDivision === vm.division.oktmo;
        }

        function discard() {
            $modalInstance.dismiss('discard');
        }

        function selectAvailable() {
            var territory,
                available = false;

            if (isFiasDivision()) {
                territory = fiasTerritory();
                available = Boolean(territory && territory.regionGuid);
            }
            else if (isOktmoDivision()) {
                territory = oktmoTerritory();
                available = Boolean(territory && territory.regionCode);
            }

            return available;
        }

        function select() {
            var territory;

            if (isFiasDivision()) {
                territory = fiasTerritory();

                if (territory) {
                    putFiasFormattedNames(territory);
                    returnTerritory({fias: territory});
                }
            }
            else if (isOktmoDivision()) {
                territory = oktmoTerritory();

                if (territory) {
                    putOktmoFormattedNames(territory)
                        .then(function () {returnTerritory({oktmo: territory});});
                }
            }


            function returnTerritory(returnedTerritory) {
                returnedTerritory.formattedName = territory.formattedName;
                $modalInstance.close(returnedTerritory);
            }
        }

        function fiasTerritory() {
            var fiasData = vm.fiasForm.filter,
                territory;

            if (fiasData.regionCode) {
                territory = {};
                territory.regionGuid = fiasData.regionCode;
            }
            if (fiasData.areaCode) {
                territory = territory || {};
                territory.areaGuid = fiasData.areaCode;
            }
            if (fiasData.cityCode) {
                territory = territory || {};
                territory.cityGuid = fiasData.cityCode;
            }
            if (fiasData.settlementCode) {
                territory = territory || {};
                territory.settlementGuid = fiasData.settlementCode;
            }

            return territory;
        }

        function putFiasFormattedNames(fiasTerritory) {
            var fiasData = vm.fiasForm.filter,
                formattedName = fiasData.address.region;

            fiasTerritory.regionFormattedName = formattedName;

            if (fiasTerritory.areaGuid) {
                formattedName = fiasData.address.area;
                fiasTerritory.areaFormattedName = formattedName;
            }
            if (fiasTerritory.cityGuid) {
                formattedName = fiasData.address.city;
                fiasTerritory.cityFormattedName = formattedName;
            }
            if (fiasTerritory.settlementGuid) {
                formattedName = fiasData.address.settlement;
                fiasTerritory.settlementFormattedName = formattedName;
            }

            fiasTerritory.formattedName = formattedName;
        }

        function oktmoTerritory() {
            var oktmoData = vm.oktmoForm.searchParameters,
                territory;

            if (oktmoData.region) {
                territory = {};
                territory.regionCode = oktmoData.region.code;
            }
            if (oktmoData.level3Guid) {
                territory = territory || {};
                territory.level3Code = oktmoData.level3Guid.code;
            }
            if (oktmoData.level5Guid) {
                territory = territory || {};
                territory.level5Code = oktmoData.level5Guid.code;
            }
            if (oktmoData.level7Guid) {
                territory = territory || {};
                territory.level7Code = oktmoData.level7Guid.code;
            }

            return territory;
        }

        function putOktmoFormattedNames(oktmoTerritory) {
            var oktmoData = vm.oktmoForm.searchParameters;

            return $ClassifierService.findOktmoRegionRootsWithParams({useCodes: [oktmoTerritory.regionCode]})
                .then(putFormattedNames, publicStatisticError);


            function putFormattedNames(oktmoRegions) {
                var formattedName = oktmoRegions[0].formalName;

                oktmoTerritory.regionFormattedName = formattedName;

                if (oktmoTerritory.level3Code) {
                    formattedName = oktmoData.level3Guid.name;
                    oktmoTerritory.level3FormattedName = formattedName;
                }
                if (oktmoTerritory.level5Code) {
                    formattedName = oktmoData.level5Guid.name;
                    oktmoTerritory.level5FormattedName = formattedName;
                }
                if (oktmoTerritory.level7Code) {
                    formattedName = oktmoData.level7Guid.name;
                    oktmoTerritory.level7FormattedName = formattedName;
                }

                oktmoTerritory.formattedName = formattedName;
            }
        }
    }
}(angular));

(function (angular) {'use strict';
    intanTerritorySelect.$inject = ["$modal"];
    angular.module('pafo-common-web-package')
        .factory('intanTerritorySelect', intanTerritorySelect);

    /* @ngInject */
    function intanTerritorySelect($modal) {
        return function (params) {
            return $modal.open({
                templateUrl: 'shared/intan-territory-select/intan-territory-select.tpl.html',
                controller: 'IntanTerritorySelectCtrl',
                controllerAs: 'vm',
                size: 'md',
                resolve: {
                    params: function() {return params;}
                }
            }).result;
        };
    }
})(angular);

(function (angular) {'use strict';
    intanWidgetHeaderDirective.$inject = ["intanAppInfo", "intanMoment"];
    angular.module('pafo-common-web-package')
        .directive('intanWidgetHeader', intanWidgetHeaderDirective);

    /* @ngInject */
    function intanWidgetHeaderDirective(intanAppInfo, intanMoment) {
        return {
            restrict: 'E',
            scope: {
                pageTitle: '=',
                breadcrumbs: '=',
                infoDate: '='
            },
            template:
                '<form-header page-title="pageTitle" breadcrumbs="breadcrumbs" ng-if="showFormHeader"></form-header>' +
                '<span class="text_light" ng-if="infoDate">Данные по информации, размещенной в ГИС ЖКХ, по состоянию на ' +
                '{{mskInfoDate()}}</span>',
            link: link
        };

        function link(scope) {
            scope.showFormHeader = !intanAppInfo.isOrganizationCabinet();

            scope.breadcrumbs[0].label = intanAppInfo.isOrganizationCabinet() ? 'Личный кабинет' : 'Главная страница';

            scope.mskInfoDate = function () {
                return intanMoment(scope.infoDate).utcOffset('+03:00').format('DD.MM.YYYY HH:mm (МСК, UTC + 3)');
            };
        }
    }
}(angular));

(function (angular) {'use strict';
    intanYearIntervalDirective.$inject = ["intanMoment"];
    angular.module('pafo-common-web-package')
        .directive('intanYearInterval', intanYearIntervalDirective);

    /* @ngInject */
    function intanYearIntervalDirective(intanMoment) {
        return {
            restrict: 'E',
            scope: {
                ngModel: '=',
                ngChange: '&'
            },
            templateUrl: 'shared/intan-year-interval/intan-year-interval.tpl.html',
            link: link
        };

        function link(scope) {
            scope.hcsDatepickerOptions = {
                format: 'yyyy',
                datepickerMode: 'year',
                showButtonBar: true,
                closeOnDateSelection: true
            };

            scope.$watch(function () {return scope.yearFrom;}, updateModel);
            scope.$watch(function () {return scope.yearTo;}, updateModel);


            function updateModel() {
                var yearFrom = scope.yearFrom,
                    yearTo = scope.yearTo;

                scope.ngModel.yearFrom = getYear(yearFrom);
                scope.ngModel.yearTo = getYear(yearTo);
                scope.isInvalid = yearFrom && yearTo && yearFrom > yearTo;
                scope.ngModel.isValid = !scope.isInvalid;

                scope.ngChange();
            }

            function getYear(hcsDatepickerDate) {
                return !hcsDatepickerDate ? null : intanMoment(hcsDatepickerDate, 'YYYY').year();
            }
        }
    }
}(angular));

angular.module('pafo-common-web-package').
    value('MapData',
            [
                {
                    id: '25',
                    name: 'Приморский край',
                    path: 'M575.354,370.615c-0.355-0.235-0.078-1.102,1.063-3.268c0.866-1.616,1.575-3.151,1.575-3.428c0-0.274-1.143-2.323-2.561-4.568c-1.772-2.874-3.19-4.569-4.727-5.791c-1.181-0.944-2.167-2.008-2.167-2.363c0-0.787,1.183-4.371,1.655-4.961c0.196-0.237,1.537-0.632,2.993-0.907c3.151-0.512,4.806-1.103,4.806-1.733c0-0.235-0.235-1.142-0.552-2.008c-0.315-0.867-0.669-3.467-0.827-5.711c-0.196-3.112-0.512-4.688-1.221-6.263c-0.984-2.206-1.181-3.19-0.63-3.19c0.196,0,0.63-0.237,1.024-0.551c0.708-0.474,0.708-0.593,0.078-1.497c-0.59-0.945-0.59-1.064,0.394-2.836l1.024-1.813h3.032h3.033l2.168-1.93l2.125-1.932l-1.063-2.204l-1.063-2.166l1.457-0.118c1.142-0.117,1.496-0.315,1.691-1.103c0.436-1.536,0.396-5.437-0.038-5.711c-0.197-0.158-1.023-0.08-1.813,0.156c-1.102,0.316-1.692,0.238-2.56-0.195c-0.631-0.316-1.143-0.71-1.143-0.907c0-0.158,0.71-1.339,1.615-2.56l1.614-2.246l1.813,1.3c1.3,0.946,1.891,1.656,1.97,2.401c0.117,0.789,0.472,1.223,1.417,1.616c1.065,0.435,1.34,0.786,1.536,2.048c0.158,0.828,0.63,3.032,1.063,4.885c0.788,3.033,0.865,4.765,1.064,19.694l0.196,16.347l-2.521,5.513l-2.521,5.475l-4.844,1.458c-2.641,0.827-5.043,1.654-5.319,1.89c-0.314,0.237-0.59,1.617-0.707,3.151c-0.118,1.498-0.552,3.506-0.946,4.529c-0.592,1.457-0.945,1.812-1.733,1.812C576.259,370.892,575.63,370.773,575.354,370.615z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '22',
                    name: 'Алтайский край',
                    path: 'M268.801,338.279l-4.057,1.694c-2.915,1.18-5.317,1.89-8.469,2.363l-4.962,1.141c1.182,1.892,2.048,4.49,5.711,14.771c1.575,4.413,2.954,7.957,3.072,7.957c0.158,0,0.945-0.906,1.773-2.009c2.166-2.915,2.954-2.441,4.371,2.521l0.631,2.245l2.008,0.039c1.143,0.04,4.057,0.04,6.46-0.039l4.372-0.078l1.26,1.771c1.064,1.46,1.458,1.734,2.246,1.578c0.551-0.118,1.141-0.552,1.418-0.985c0.473-0.907,0.315-1.023-2.048-2.363c-1.064-0.591-1.182-0.828-0.788-1.301c0.275-0.354,0.63-0.591,0.866-0.591c0.236,0,1.891-0.473,3.743-1.023c3.189-0.984,3.27-1.024,5.081-3.546l1.812-2.56l2.128,0.196c2.047,0.277,2.086,0.316,2.323-0.787c0.158-0.63,0.512-1.853,0.827-2.757c0.433-1.182,0.512-2.443,0.315-4.924l-0.276-3.309l-3.781-4.411c-2.087-2.442-3.978-4.451-4.214-4.451c-0.237,0-0.669,0.276-0.945,0.593c-0.868,1.063-1.773,1.339-5.514,1.771l-3.664,0.394l-1.97,2.168c-1.103,1.22-2.206,2.167-2.443,2.125c-0.236-0.077-2.047-1.93-3.859-4.134L268.801,338.279z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '17',
                    name: 'Республика Тыва',
                    path: 'M313.703,378.18c-0.433-0.473-0.354-0.749,0.354-1.499c1.103-1.18,1.063-1.573-0.354-3.82c-0.63-1.062-1.577-2.954-2.127-4.213c-1.104-2.599-0.945-2.836,1.812-2.836c2.206,0,2.993-0.67,3.308-2.799c0.158-0.824,0.592-1.81,0.986-2.204c0.748-0.631,0.826-0.592,2.125,0.63c1.223,1.183,1.655,1.34,4.924,1.694c6.617,0.749,10.162-0.905,13.272-6.183c0.749-1.301,1.971-2.916,2.719-3.626c0.827-0.747,1.339-1.575,1.339-2.205c0-1.259,0.513-1.613,3.151-2.363c6.933-1.969,6.774-1.89,6.577-2.677c-0.354-1.42,1.774-0.867,6.224,1.573c3.782,2.049,4.373,2.285,5.397,1.932c0.825-0.315,1.299-0.276,1.693,0.079c0.512,0.434,0.473,0.59-0.316,1.338c-1.377,1.301-1.771,4.609-0.67,6.104c0.434,0.631,0.789,1.301,0.789,1.498c0,0.196-1.22,2.086-2.757,4.253c-1.496,2.128-2.757,3.979-2.757,4.136c0,0.118,0.708,2.009,1.575,4.215c0.866,2.205,1.575,4.177,1.575,4.41c0,0.236-0.867,0.867-1.971,1.421c-1.89,0.944-2.205,0.983-9.609,0.983h-7.641l-0.473-2.01c-0.315-1.26-0.789-2.166-1.341-2.479c-0.433-0.277-3.308-0.909-6.341-1.418l-5.514-0.867l-7.602,3.781c-4.176,2.086-7.641,3.781-7.72,3.781C314.254,378.81,313.979,378.533,313.703,378.18z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '19',
                    name: 'Республика Хакасия',
                    path: 'M306.219,366.479c-0.788-0.391-0.985-0.824-1.104-2.322c-0.118-1.614,0-1.929,0.945-2.56c1.97-1.341,6.065-5.592,6.065-6.302c0-0.395-0.275-1.773-0.591-3.073c-0.788-3.309-0.748-4.096,0.435-5.631c1.024-1.301,1.024-1.379,0.432-2.878c-0.472-1.219-0.511-1.81-0.156-2.913c0.512-1.732,0.275-2.009-1.339-1.418c-0.709,0.237-1.34,0.355-1.418,0.276c-0.079-0.08,0.196-0.946,0.551-1.929c0.669-1.813,0.669-1.853-0.237-3.429c-0.827-1.497-0.906-2.797-0.158-2.758c0.198,0,0.828,0.827,1.418,1.774c1.3,2.008,1.813,2.126,6.185,1.181c1.418-0.314,2.717-0.394,2.875-0.237c0.197,0.197,0.512,1.104,0.709,2.05c0.197,0.944,1.535,3.978,2.914,6.695c1.419,2.757,2.56,5.198,2.56,5.515c0,0.275-0.589,1.143-1.299,1.89c-0.75,0.787-1.536,2.167-1.812,3.072c-0.355,1.379-1.062,2.167-3.781,4.451c-2.246,1.853-3.428,3.151-3.584,3.86c-0.55,2.599-0.709,2.757-3.584,3.032c-3.545,0.315-4.097,0.513-3.979,1.301C308.424,366.954,307.479,367.11,306.219,366.479z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '79',
                    name: 'Еврейская автономная область',
                    path: 'M552.351,328.471c-0.354-0.157-1.575-1.417-2.757-2.796c-3.782-4.45-3.545-3.938-2.954-6.5c0.315-1.219,0.591-2.322,0.671-2.361c0.629-0.514,8.231-4.57,8.585-4.57c0.236,0,1.063,0.275,1.813,0.67c1.379,0.631,1.575,0.631,4.963-0.235c1.93-0.512,3.624-0.868,3.742-0.749c0.077,0.119-0.907,1.812-2.208,3.82c-1.298,1.971-2.874,4.609-3.503,5.83c-1.301,2.598-5.279,6.655-6.736,6.971C553.415,328.63,552.705,328.63,552.351,328.471z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '01',
                    name: 'Республика Адыгея',
                    path: 'M14.357,322.563c-0.275-0.59-0.591-1.221-0.669-1.379c-0.079-0.155,0.276-0.274,0.788-0.274c0.513-0.041,1.182-0.197,1.497-0.395c0.473-0.314,0.512-0.513,0.118-1.182c-0.827-1.3-0.59-1.813,1.025-2.56c1.496-0.671,2.638-2.246,2.205-2.994c-0.157-0.196-0.827-0.354-1.576-0.354c-1.496,0-3.19-1.458-3.583-3.072c-0.354-1.38,0.078-1.497,1.417-0.354c0.906,0.749,1.694,1.063,2.796,1.063c1.418,0,1.616,0.118,2.167,1.379c0.788,1.891,1.182,6.183,0.63,7.128c-0.394,0.671-0.473,0.632-0.867-0.551c-0.275-0.709-0.669-1.26-0.945-1.26c-0.236,0-1.221,1.299-2.206,2.954c-0.945,1.614-1.852,2.954-2.009,2.954C15.028,323.667,14.673,323.154,14.357,322.563z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '68',
                    name: 'Тамбовская область',
                    path: 'M68.516,274.707c-2.915-3.15-3.584-4.018-3.86-5.118c-0.197-0.907-0.119-1.104,0.788-1.301c0.985-0.276,0.985-0.316,0.905-3.349c-0.078-1.692-0.039-3.151,0.08-3.229c2.835-2.323,4.175-3.032,5.554-3.032c1.221,0,1.615,0.157,1.969,0.985c0.512,1.102,0.551,1.14,2.915,0.512c1.654-0.396,1.89-0.357,2.639,0.431l0.866,0.869l-1.103,0.787l-1.103,0.827l0.275,4.647l0.276,4.648l-3.979,2.008c-2.205,1.104-4.135,2.01-4.332,2.01C70.249,276.402,69.382,275.654,68.516,274.707z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '37',
                    name: 'Ивановская область',
                    path: 'M96.402,242.37c-2.994-3.82-5.002-5.75-5.869-5.75c-0.433,0-1.023-0.276-1.299-0.591c-0.394-0.514-0.355-0.748,0.236-1.418c0.59-0.669,0.63-0.944,0.236-1.576c-0.708-1.142-0.275-1.535,1.654-1.535c1.142,0,2.048,0.273,2.994,0.944c1.733,1.301,5.238,2.128,6.105,1.419c0.512-0.434,0.748-0.395,1.457,0.237c1.97,1.691,2.64,2.677,2.404,3.741c-0.158,0.904,0.039,1.181,1.417,1.93c1.813,1.024,2.049,1.575,0.749,1.575c-0.473,0-1.261,0.353-1.733,0.827c-0.709,0.63-1.024,0.709-1.654,0.395c-1.497-0.827-2.757-0.553-3.427,0.709c-0.314,0.63-0.748,1.26-0.945,1.377C98.528,244.772,97.466,243.75,96.402,242.37z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '31',
                    name: 'Белгородская область',
                    path: 'M43.938,276.166c-0.276-0.315-0.709-2.521-0.945-4.886c-0.237-2.402-0.631-4.489-0.827-4.687c-0.236-0.196-1.261-0.669-2.285-1.063c-1.575-0.552-2.167-1.103-3.309-2.875c-1.3-2.05-1.339-2.245-0.906-3.702c0.236-0.828,0.669-1.615,0.945-1.695c0.788-0.313,3.664,0.906,5.632,2.365c1.221,0.943,2.246,1.416,3.112,1.416c1.063,0,1.536,0.315,2.678,1.695c1.3,1.576,1.418,1.929,1.418,4.255c-0.04,3.779-0.512,5.276-2.403,7.403C45.001,276.678,44.528,276.912,43.938,276.166z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '62',
                    name: 'Рязанская область',
                    path: 'M80.213,259.74c-1.22-1.221-1.26-1.221-3.071-0.748c-1.3,0.354-1.931,0.395-2.009,0.078c-0.315-0.906-1.378-1.576-2.56-1.576c-1.615-0.038-1.812-0.156-3.978-2.952c-1.97-2.562-2.088-2.798-1.221-3.113c0.315-0.118,1.024-1.101,1.576-2.204c0.631-1.262,1.3-2.049,1.891-2.167c2.087-0.512,9.217-1.771,9.965-1.771c0.827,0,4.017,3.662,6.223,7.167l1.142,1.894l-2.914,3.07c-1.615,1.733-3.112,3.188-3.388,3.348C81.632,260.883,80.883,260.41,80.213,259.74z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '12',
                    name: 'Республика Марий Эл',
                    path: 'M117.868,265.491c-0.08-0.196-0.591-1.694-1.063-3.387c-0.552-1.892-1.142-3.112-1.536-3.191c-0.355-0.118-1.654-0.394-2.914-0.63l-2.285-0.473l0.118-2.206l0.119-2.167l1.772-0.512c1.498-0.473,1.891-0.432,2.639,0.041c0.473,0.314,1.143,0.591,1.418,0.591c0.395,0,0.67,0.707,0.828,2.363c0.315,2.757,0.67,2.874,2.994,1.221l1.575-1.143l3.229,0.749c1.772,0.432,3.309,0.825,3.348,0.903c0.079,0.042,0.394,1.578,0.709,3.388c0.512,2.915,0.512,3.389,0,3.9c-0.513,0.513-0.709,0.474-1.694-0.276c-0.63-0.433-1.379-0.866-1.693-0.945c-0.473-0.078-4.805,1.103-6.814,1.892C118.341,265.729,117.986,265.648,117.868,265.491z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '08',
                    name: 'Республика Калмыкия',
                    path: 'M52.091,340.091c-1.931-1.772-2.403-2.521-3.073-4.607c-0.432-1.379-1.378-3.822-2.126-5.436c-0.749-1.615-1.497-3.663-1.615-4.57c-0.275-1.692-2.56-6.184-3.781-7.404c-0.395-0.433-1.261-0.708-2.049-0.708c-1.103,0-1.378-0.158-1.496-0.906c-0.08-0.71-0.316-0.868-1.34-0.75c-0.709,0.04-1.417-0.157-1.654-0.472c-0.394-0.433-0.119-0.59,1.576-0.826c1.142-0.158,2.402-0.552,2.756-0.867c0.591-0.553,0.749-0.434,1.694,1.064c0.59,0.905,1.26,2.205,1.536,2.913c0.907,2.442,1.221,2.719,3.466,2.876c2.127,0.195,2.166,0.156,2.679-1.063c0.512-1.223,0.551-1.261,2.363-0.983l1.891,0.233l1.457-2.362c0.788-1.337,1.34-2.599,1.182-2.796c-0.118-0.236-0.945-0.394-1.812-0.394c-1.299,0-1.575-0.119-1.457-0.71c0.119-0.552,0.631-0.708,3.072-0.788c2.284-0.118,3.152-0.314,3.781-0.904c0.906-0.867,1.339-0.671,1.339,0.59c0,1.26,0.748,1.852,1.694,1.338c1.339-0.706,1.654,0.198,1.654,4.926v4.409l1.496,0.118c0.788,0.081,1.458,0.277,1.458,0.473c0,0.198-0.434,0.986-0.985,1.774c-0.63,0.984-0.866,1.771-0.749,2.481c0.512,2.599,0.552,2.599-2.205,3.111c-1.378,0.315-2.718,0.71-2.915,0.906c-0.236,0.195-0.079,0.983,0.354,1.969l0.749,1.615l-1.891,1.813c-1.891,1.849-1.891,1.849-1.063,2.52c1.103,0.905,1.063,1.182-0.434,2.204C55.203,342.494,54.611,342.376,52.091,340.091z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '46',
                    name: 'Курская область',
                    path: 'M48.743,261.867c-0.985-1.219-1.616-1.614-2.915-1.811c-1.024-0.197-2.481-0.867-3.663-1.773c-1.064-0.789-2.718-1.653-3.624-1.929c-1.379-0.395-1.694-0.671-1.694-1.38c0-0.514-0.354-1.929-0.788-3.19c-1.024-2.993-1.024-3.112,0.591-3.86c0.748-0.354,1.654-1.221,1.969-1.89c0.631-1.223,0.749-1.262,2.679-1.065c1.89,0.198,2.166,0.395,4.136,2.523c2.915,3.228,3.19,3.66,3.663,6.183c0.354,1.93,0.669,2.52,2.56,4.371c1.182,1.184,2.127,2.324,2.127,2.521c0,0.198-0.473,0.672-1.063,1.064C49.727,263.562,50.082,263.521,48.743,261.867z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '45',
                    name: 'Курганская область',
                    path: 'M197.154,315.907c-4.213-0.472-6.104-0.511-7.286-0.198c-1.182,0.316-2.64,0.237-5.987-0.273c-2.403-0.356-4.529-0.788-4.688-0.946c-0.118-0.157,0.237-0.905,0.828-1.694c0.59-0.747,0.985-1.614,0.866-1.89c-0.118-0.275-1.378-0.828-2.796-1.223c-1.418-0.354-2.599-0.826-2.599-0.943c0-0.63,2.363-3.861,3.702-5.16c1.379-1.338,1.418-1.42,1.418-4.333v-3.032l1.379-0.631c0.787-0.393,1.812-0.669,2.324-0.669c1.615,0,4.609,1.261,5.239,2.205c0.748,1.182,1.181,1.182,2.679,0c1.654-1.34,2.678-0.789,2.323,1.261c-0.354,2.166,2.087,7.049,3.703,7.365c2.048,0.433,4.371,1.733,5.042,2.837c0.394,0.59,1.458,1.811,2.363,2.679c2.284,2.125,2.481,3.032,0.985,4.094C204.993,316.537,203.812,316.576,197.154,315.907z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '64',
                    name: 'Саратовская область',
                    path: 'M88.524,309.604c-0.197-0.395-0.513-1.338-0.669-2.087c-0.158-0.788-0.906-3.033-1.694-5.043c-1.222-3.189-1.536-3.701-2.481-3.899c-0.67-0.115-1.339-0.708-1.891-1.732c-0.629-1.142-1.181-1.575-2.126-1.771l-1.3-0.237l0.04-3.427c0-2.205-0.158-3.702-0.473-4.058c-0.276-0.314-1.852-0.905-3.506-1.339c-2.717-0.67-3.072-0.865-3.623-2.009c-0.473-1.022-0.512-1.495-0.158-2.204c0.237-0.475,0.512-1.576,0.551-2.441c0.119-1.538,0.197-1.617,3.073-3.075c1.615-0.786,3.15-1.456,3.387-1.456c0.197,0,1.103,0.709,1.969,1.614c0.828,0.866,2.758,2.679,4.215,3.978c2.441,2.167,2.994,2.482,6.144,3.309c2.679,0.71,3.821,1.262,5.002,2.285c0.827,0.787,2.285,1.694,3.269,2.01c1.024,0.353,2.048,0.787,2.363,0.905c1.536,0.786,7.68,14.258,6.735,14.849c-0.512,0.316-8.508,1.653-11.896,2.012c-2.914,0.272-3.742,0.863-4.45,3.028C90.533,310.275,89.115,310.709,88.524,309.604z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '33',
                    name: 'Владимирская область',
                    path: 'M85.097,247.963c-2.914-3.662-2.797-3.19-1.615-5.828l1.024-2.363l-1.417-1.301c-2.049-1.851-2.285-2.757-1.498-5.671c0.355-1.379,0.789-2.481,0.906-2.481c0.119,0,0.749,0.631,1.378,1.418c1.063,1.339,1.221,1.378,2.797,1.142c2.009-0.276,2.6,0.236,1.536,1.419c-0.67,0.707-0.67,0.865-0.118,1.851c0.314,0.591,1.182,1.262,1.89,1.498c1.772,0.551,7.681,7.205,7.011,7.876c-0.394,0.395-9.453,4.49-9.886,4.45C86.87,249.972,85.964,249.066,85.097,247.963z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '14',
                    name: 'Республика Саха (Якутия)',
                    path: 'M456.679,284.594c-2.757-2.086-3.033-2.48-4.293-5.868c-0.749-1.891-2.167-3.938-7.484-10.597l-1.063-1.338l-2.482,1.063l-2.481,1.064l-2.48-2.402l-2.52-2.404l-2.879,0.236c-1.573,0.158-3.148,0.355-3.504,0.473c-0.314,0.08-1.614,2.246-2.837,4.769c-1.691,3.505-2.323,5.237-2.48,7.089c-0.197,1.693-0.511,2.68-1.023,3.149c-0.748,0.67-0.826,0.631-1.852-0.668c-0.749-0.906-1.3-1.262-1.732-1.063c-1.221,0.432-6.774,4.294-8.192,5.671l-1.417,1.341l-1.223-1.065c-1.495-1.22-1.536-1.534-0.631-10.477c0.355-3.466,0.513-6.537,0.435-6.813c-0.119-0.276-0.789-0.633-1.458-0.789c-0.866-0.196-1.654-0.906-2.796-2.442c-1.418-1.93-1.576-2.363-1.379-3.704c0.117-0.786,0.354-1.771,0.474-2.085c0.156-0.434-0.276-0.944-1.577-1.733c-1.103-0.671-1.771-1.378-1.812-1.813c0-0.826-1.497-3.585-3.033-5.672c-0.669-0.945-1.379-1.339-2.521-1.535c-1.457-0.236-1.535-0.276-0.905-0.945c0.513-0.591,0.552-0.945,0.198-2.047c-0.828-2.443-1.262-2.602-7.131-2.759l-5.317-0.078l-0.117-1.891c-0.079-1.222,0.156-2.442,0.708-3.664c0.433-1.023,0.787-2.205,0.787-2.6c0-0.434-0.826-1.93-1.811-3.309c-1.458-2.047-1.853-2.993-2.127-5.04c-0.434-2.877-0.709-3.782-1.221-3.782c-0.907,0-0.709-1.261,0.473-2.874l1.26-1.813l-1.456-7.405l-1.419-7.404l-2.008-2.009l-2.01-2.048l2.246-2.244c2.125-2.127,2.362-2.246,3.781-2.088c2.086,0.315,2.52-0.394,3.07-4.805c0.276-2.087,0.591-4.057,0.709-4.451c0.08-0.395,1.34-2.009,2.719-3.545c1.377-1.576,2.521-3.151,2.521-3.506c0-1.103-6.067-9.886-7.879-11.461c-1.613-1.378-1.771-1.693-2.56-5.317c-0.474-2.088-0.788-4.097-0.71-4.412c0.159-0.63,2.561-2.363,3.27-2.363c0.197,0,0.749,0.709,1.183,1.576c1.063,2.087,1.968,2.048,3.07-0.197c1.063-2.207,1.891-2.718,5.949-3.742c3.309-0.788,3.978-0.788,3.978,0.157c0,0.828,2.323,2.6,3.389,2.6c0.513,0,3.032-0.867,5.592-1.93c2.521-1.064,5.001-2.049,5.475-2.167c1.301-0.433,1.379-1.261,0.315-3.664c-1.143-2.521-1.182-3.229-0.434-4.293c0.473-0.63,0.985-0.708,3.545-0.63c2.875,0.119,3.072,0.079,4.412-1.102c0.748-0.631,1.535-1.182,1.693-1.182c0.195,0,2.166,1.615,4.411,3.623c3.111,2.836,3.861,3.664,3.27,3.782c-0.827,0.157-1.734,0.787-1.734,1.261c0,0.157,1.38,1.299,3.032,2.559c2.681,2.009,3.744,2.521,8.353,4.018c7.05,2.245,7.09,2.206,5.04-3.938c-0.787-2.442-1.456-4.766-1.456-5.121c0-0.551,0.511-0.63,3.663-0.551l3.623,0.079l0.787-2.285c0.434-1.221,1.025-2.325,1.34-2.442c0.315-0.119,1.655-0.354,2.955-0.473c3.11-0.314,3.86-0.708,3.584-1.812c-0.197-0.668,0.195-1.26,1.573-2.599c0.985-0.946,1.774-1.852,1.774-2.049c0-0.196-1.222-1.299-2.756-2.402c-2.839-2.048-2.995-2.284-3.27-5.553c-0.198-2.206-0.04-2.441,3.188-4.254c7.091-4.017,11.699-6.892,14.063-8.862c2.403-1.969,2.837-2.166,4.294-2.047c1.732,0.118,1.691,0.039,1.142,2.718c-0.118,0.63,0,1.103,0.354,1.221c0.552,0.196,13.233-2.481,14.022-2.993c0.276-0.158,1.969-3.27,3.819-6.894l3.35-6.616l3.151-1.654c3.11-1.615,3.19-1.615,5.396-1.221c1.694,0.315,2.48,0.709,3.15,1.497c0.473,0.59,0.905,1.221,0.905,1.378c0,0.118,0.356,0.354,0.788,0.512c1.183,0.354,5.437-2.678,6.146-4.412c0.668-1.536,0.59-1.536,4.605,0.079c2.364,0.946,5.396,3.112,5.396,3.781c0,0.237-0.353,0.867-0.786,1.418c-0.434,0.552-0.789,1.536-0.789,2.167c0,1.379-0.513,2.402-2.008,4.174c-1.024,1.143-1.142,1.537-1.142,4.096c0,2.403,0.156,3.033,0.787,3.585c0.433,0.394,0.866,1.023,0.983,1.418c0.395,1.26,3.034,2.087,5.83,1.772l2.521-0.276l2.167,2.402l2.204,2.442l-0.472,2.048c-0.434,1.89-0.552,2.048-1.813,2.245c-1.023,0.157-1.379,0.433-1.575,1.142c-0.156,0.669-1.221,1.615-3.229,2.954c-1.692,1.103-3.031,2.245-3.031,2.6c-0.041,0.314,0.59,0.984,1.378,1.496c1.142,0.748,1.379,1.064,1.142,1.772c-0.749,2.403-0.709,2.561,0.748,3.467c1.38,0.905,1.459,0.985,1.222,2.718c-0.236,1.772-0.198,1.851,1.929,4.136c1.222,1.299,2.207,2.561,2.207,2.796c0,0.236-0.708,1.26-1.615,2.284c-1.378,1.537-1.576,2.01-1.458,3.23c0.158,1.378,0.158,1.378-1.142,1.143c-1.222-0.238-1.575-0.041-4.058,2.167c-1.536,1.338-2.756,2.638-2.756,2.914c0,0.237,0.629,1.064,1.378,1.812c0.788,0.749,1.341,1.497,1.26,1.694c-0.038,0.158-1.142,0.906-2.441,1.576l-2.363,1.261l-0.118,2.56c-0.158,3.623,1.379,6.853,4.805,10.123l2.482,2.402l0.55,3.27c0.789,4.687,0.868,4.49-1.378,4.49c-1.931,0-1.969,0-2.875,1.812c-1.142,2.284-2.48,2.835-6.774,2.757c-2.915-0.079-3.032-0.039-3.702,1.063c-0.354,0.67-0.67,1.417-0.67,1.733c0,0.315,0.826,2.088,1.813,3.977l1.771,3.428l-1.22,1.535l-1.262,1.537l0.63,2.952c0.552,2.797,0.828,3.271,3.781,7.012c3.23,4.097,3.389,4.648,1.34,4.688c-0.904,0-1.34,1.379-1.34,4.529v1.575l-2.441,0.789l-2.482,0.787l0.118,2.364l0.118,2.362L508,235.319l-3.86,2.01l0.16,5.712c0.116,5.474,0.077,5.711-0.71,6.145c-1.26,0.669-0.985,1.457,0.866,2.48c1.733,0.985,1.733,1.024,1.3,3.742l-0.275,1.613l2.561,1.498c1.416,0.827,2.677,1.733,2.795,2.047c0.119,0.316,0,1.183-0.275,1.932c-0.433,1.142-0.354,1.813,0.395,4.727c0.984,3.86,0.904,4.135-1.693,4.806c-1.497,0.354-1.891,0.71-3.152,2.716c-1.338,2.166-1.534,2.363-3.661,2.836c-1.46,0.355-3.388,1.342-5.673,2.876c-3.27,2.204-3.585,2.323-5.199,2.05c-1.339-0.197-2.166-0.04-3.979,0.746c-2.876,1.301-3.269,1.261-5.711-0.235l-2.008-1.261l-3.27,1.064c-3.545,1.141-7.286,1.377-10.202,0.59c-1.654-0.432-1.732-0.432-4.214,1.379c-1.379,1.023-2.6,1.813-2.717,1.813C459.356,286.604,458.097,285.698,456.679,284.594z M443.524,116.567c-0.395-2.56-0.316-2.875,1.18-3.466c1.577-0.669,4.925-0.63,5.162,0.079c0.156,0.433-3.506,3.466-5.28,4.412C443.878,117.985,443.762,117.867,443.524,116.567z M427.964,109.556c-0.982-0.315-1.929-0.709-2.125-0.945c-0.395-0.394-1.418-5.042-1.457-6.617c0-0.866,0.078-0.906,3.466-0.788l3.425,0.157l-0.116-1.182c-0.038-0.669-0.118-1.655-0.198-2.167c-0.039-0.748,0.119-0.984,0.71-0.984c0.551,0,0.866,0.394,1.103,1.496c0.355,1.418,0.592,1.655,3.072,2.758l2.68,1.26l-1.971,2.561C432.376,110.501,431.824,110.777,427.964,109.556z M436.788,99.669c-3.033-1.654-2.874-3.781,0.314-4.292c1.261-0.197,1.379-0.118,1.813,1.063c0.473,1.458,0.592,4.333,0.158,4.294C438.875,100.733,437.891,100.261,436.788,99.669z M443.366,93.998c-1.064-1.102-0.433-1.732,3.662-3.781c5.318-2.639,5.516-2.639,5.16-0.078c-0.157,1.063-0.354,2.205-0.473,2.48c-0.118,0.316-1.575,0.828-3.23,1.182C444.862,94.589,443.996,94.628,443.366,93.998z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '63',
                    name: 'Самарская область',
                    path: 'M107.785,300.349c-0.788-2.56-3.781-8.704-4.884-10.084c-0.315-0.392-0.158-0.591,0.512-0.748c0.827-0.235,0.866-0.354,0.591-2.994c-0.315-3.347-0.236-3.427,3.584-3.427c2.64,0,2.876,0.08,4.884,1.578c1.182,0.867,2.206,1.576,2.285,1.576c0.079,0,1.063-0.789,2.206-1.774l2.088-1.771l0.867,1.18c0.984,1.38,1.614,1.457,2.599,0.395c0.906-1.025,1.458-1.025,2.64,0.118c0.631,0.591,1.143,1.693,1.497,3.309l0.512,2.44l-2.915,3.27c-3.466,3.86-3.072,3.546-6.263,4.926c-1.575,0.668-3.19,1.731-4.175,2.756c-1.024,1.022-2.009,1.694-2.561,1.694c-0.512,0-1.3,0.077-1.732,0.195C108.809,303.185,108.573,302.869,107.785,300.349z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '58',
                    name: 'Пензенская область',
                    path: 'M90.494,282.781c-3.584-1.023-3.821-1.181-7.366-4.41c-2.009-1.853-3.781-3.625-3.899-3.9c-0.157-0.315,0.04-0.749,0.354-0.984c0.512-0.393,0.591-1.26,0.512-5.158l-0.118-4.688l1.063-0.393c1.537-0.552,5.869,2.323,7.641,5.119c1.615,2.48,1.813,2.639,2.757,1.932c0.63-0.436,1.024-0.396,2.915,0.431c3.269,1.458,3.427,1.735,3.663,6.184l0.157,3.822l-1.812,1.576c-0.984,0.865-1.89,1.535-2.009,1.535C94.236,283.846,92.502,283.333,90.494,282.781z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '23',
                    name: 'Краснодарский край',
                    path: 'M20.896,325.438c-0.59-0.749-1.26-1.377-1.536-1.377c-0.236,0-1.457,0.512-2.678,1.101c-1.261,0.591-2.403,0.985-2.561,0.828s-0.945-0.473-1.733-0.71c-1.694-0.551-1.931-1.337-1.931-6.814c0-2.796-0.197-4.015-1.221-6.891c-1.576-4.491-2.244-6.893-2.56-9.257c-0.236-1.694-0.157-1.891,0.513-1.891c0.393,0,1.063,0.513,1.417,1.182c0.905,1.497,1.497,1.459,3.663-0.078c1.615-1.183,1.852-1.222,4.253-0.985c2.994,0.276,3.31,0.039,3.467-2.718c0.117-2.127,0-2.049,3.348-1.537c1.142,0.199,1.26,0.315,1.063,1.301c-0.315,1.496,0.709,2.521,1.969,2.049c0.749-0.276,1.103-0.157,1.694,0.511c1.812,2.09,1.812,2.09,1.103,4.216l-0.669,1.969l1.457,2.166c1.142,1.694,1.418,2.48,1.301,3.622c-0.119,1.46-0.159,1.499-1.773,1.499c-1.498,0-1.773,0.157-2.679,1.456c-1.142,1.695-1.181,2.128-0.354,4.255c0.63,1.496,0.59,1.576-0.197,2.245c-0.434,0.395-1.063,1.418-1.34,2.285c-0.354,0.984-0.985,1.811-1.771,2.283l-1.182,0.71L20.896,325.438z M17.548,322.169l1.693-2.638l0.552,1.261c0.709,1.732,1.457,1.613,2.244-0.395c0.512-1.419,0.552-2.204,0.277-4.648c-0.631-4.844-1.379-5.867-4.294-5.867c-0.551,0-1.497-0.473-2.127-1.066c-0.946-0.903-1.221-0.981-2.087-0.591c-1.34,0.632-1.261,2.208,0.236,4.217c0.827,1.063,1.575,1.615,2.402,1.771c1.891,0.276,1.732,0.985-0.512,1.891c-2.048,0.867-2.127,1.024-1.379,2.875c0.236,0.473,0,0.671-0.905,0.867c-0.749,0.157-1.221,0.473-1.221,0.867c0,1.103,2.008,4.136,2.756,4.136C15.618,324.849,16.523,323.864,17.548,322.169z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '56',
                    name: 'Оренбургская область',
                    path: 'M153.71,336.744c-1.89-1.184-2.401-1.341-2.954-0.946c-2.048,1.457-2.363,1.457-3.979-0.119c-1.26-1.181-1.614-1.891-1.811-3.466c-0.473-3.19-2.601-4.569-5.476-3.466c-1.102,0.434-1.023,0.473-3.899-2.914l-0.985-1.182l-3.269,0.668c-1.812,0.395-3.505,0.71-3.781,0.71c-0.276,0-0.67-0.71-0.906-1.534c-0.197-0.869-0.709-1.932-1.104-2.444c-0.63-0.748-0.827-0.786-1.575-0.394c-0.472,0.235-1.024,0.354-1.222,0.235c-0.196-0.116-0.63-1.85-1.023-3.858s-0.866-3.938-1.024-4.294c-0.197-0.394-1.143-1.024-2.127-1.458c-1.733-0.786-1.772-0.826-1.772-2.717c0-2.56-0.394-2.875-3.348-2.56l-2.442,0.196l-0.236-1.262c-0.395-1.849-0.434-1.811,1.299-2.322c0.945-0.276,1.931-0.945,2.482-1.694c0.551-0.748,2.048-1.733,4.018-2.678c2.717-1.299,3.584-1.931,6.419-5.041c1.772-1.972,3.23-3.9,3.23-4.293c0-0.435,0.552,0.077,1.379,1.338c1.26,1.851,1.379,2.284,1.417,4.925c0,2.481,0.237,3.466,1.891,7.562c1.733,4.255,1.851,4.807,1.536,6.46c-0.473,2.56-0.236,2.954,1.654,2.717c0.866-0.118,1.654-0.079,1.773,0.119c0.314,0.473-0.513,2.403-1.261,2.954c-0.59,0.433-0.551,0.59,0.197,1.812c0.748,1.26,0.788,1.457,0.275,2.481c-0.984,1.851-0.749,2.441,0.906,2.718c2.246,0.395,3.545,0.314,4.412-0.237c0.669-0.394,0.984-0.276,2.324,1.064c1.852,1.771,2.442,1.693,3.584-0.552c0.434-0.867,1.103-1.575,1.457-1.575c1.575,0,5.633,0.945,5.633,1.339c0,0.236-0.276,1.261-0.67,2.283l-0.67,1.852l2.205,3.27c3.348,5.081,3.27,4.766,1.852,6.381c-0.669,0.788-1.417,1.419-1.654,1.379C156.192,338.2,154.971,337.569,153.71,336.744z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '21',
                    name: 'Чувашская Республика',
                    path: 'M106.13,270.1c-1.143-0.944-1.221-1.143-0.866-2.246c0.276-0.71,0.276-1.417,0.079-1.733c-0.591-0.944-0.394-1.337,0.945-1.929c1.142-0.552,1.26-0.786,1.378-2.639c0.118-2.008,0.158-2.088,1.497-2.323c0.749-0.159,2.324,0,3.584,0.315l2.285,0.551l0.709,2.126c0.354,1.184,0.788,2.441,0.906,2.836c0.158,0.513-0.315,0.946-2.087,1.772c-2.167,1.023-2.285,1.182-2.167,2.364c0.118,1.457-0.039,1.534-2.954,1.771C107.667,271.124,107.233,271.005,106.13,270.1z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '55',
                    name: 'Омская область',
                    path: 'M228.98,336.192c-0.118-0.197-0.118-0.986,0.04-1.774c0.315-1.692-0.04-2.205-3.19-4.213c-1.852-1.222-2.679-1.497-3.859-1.419c-1.025,0.079-1.616-0.078-1.813-0.473c-0.197-0.314-0.551-2.994-0.827-5.986l-0.473-5.396l1.93-3.86l1.891-3.861l2.363-0.59l2.363-0.59l-0.079-2.365c-0.197-3.858-0.512-4.606-2.285-5.08c-1.497-0.434-1.575-0.512-1.693-2.205c-0.079-1.418,0.158-2.205,1.221-3.939c0.71-1.182,1.458-2.126,1.655-2.048c0.235,0.039,0.63,0.789,0.944,1.654c0.551,1.693,0.315,1.576,5.751,2.915c1.299,0.314,3.939,0.67,5.83,0.827c3.268,0.235,3.583,0.197,5.198-0.748c0.945-0.551,1.812-1.026,1.931-1.026c0.118,0,0,0.632-0.197,1.42c-0.355,1.222-0.197,2.01,1.221,5.947c1.97,5.592,2.049,7.09,0.315,9.019c-1.221,1.419-1.26,1.459-0.591,2.601c0.395,0.669,0.591,1.299,0.513,1.458c-0.118,0.157-1.182,0.512-2.363,0.788c-1.221,0.274-2.402,0.709-2.678,0.985c-0.276,0.273-0.947,1.929-1.418,3.7l-0.946,3.229l1.417,1.972l1.419,1.967l-0.788,2.01c-0.434,1.103-0.749,2.285-0.67,2.601C241.347,335.167,229.806,337.53,228.98,336.192z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '36',
                    name: 'Воронежская область',
                    path: 'M49.846,283.096c-0.985-0.628-1.93-1.14-2.166-1.18c-0.316,0-1.851-2.245-2.482-3.585c-0.039-0.157,0.946-1.419,2.246-2.835c2.56-2.837,3.19-4.607,3.19-8.902v-2.283l2.206-1.497c2.481-1.655,3.859-1.655,4.49,0c0.197,0.549,0.552,0.983,0.788,0.983c0.236,0,0.749,0.788,1.181,1.733c0.552,1.3,1.104,1.93,2.088,2.323c1.417,0.592,2.639,1.971,2.639,2.993c0,0.355,1.26,1.931,2.757,3.585c2.481,2.678,2.757,3.111,2.757,4.608c0,2.049-0.63,2.206-2.678,0.631c-1.26-0.945-1.537-1.023-4.293-0.788c-1.615,0.117-3.033,0.316-3.151,0.394c-0.118,0.12-0.315,0.827-0.472,1.536c-0.237,1.144-0.552,1.42-2.561,2.206C52.878,284.397,51.895,284.437,49.846,283.096z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '42',
                    name: 'Кемеровская область',
                    path: 'M307.794,357.736c0-0.59-0.867-0.867-5.159-1.813c-2.127-0.433-2.244-0.551-2.481-1.89c-0.119-0.788-0.236-2.442-0.236-3.703c0-2.205-0.04-2.323-2.442-5.119c-1.378-1.576-3.387-3.94-4.529-5.238l-2.049-2.404l-0.59-4.884c-0.315-2.716-0.71-5.71-0.866-6.695l-0.236-1.813l2.955-0.628c1.615-0.355,3.898-1.222,5.041-1.892c1.772-1.064,2.6-1.26,6.578-1.576c2.481-0.235,4.528-0.354,4.608-0.274c2.008,2.521,3.74,5.395,3.74,6.223c0,0.632-0.511,1.536-1.457,2.441c-0.827,0.789-1.812,2.09-2.245,2.836c-0.749,1.379-0.749,1.379,0.198,3.151l0.906,1.734l-0.867,2.126c-0.473,1.144-0.867,2.323-0.867,2.639c0,0.512,0.118,0.512,2.521-0.276c0.63-0.155,0.708-0.077,0.512,0.672c-0.119,0.511,0.079,1.496,0.393,2.205c0.63,1.299,0.63,1.378-0.473,2.955c-1.103,1.573-1.103,1.691-0.629,3.858c1.063,4.884,1.063,5.12-0.354,6.579C308.306,358.446,307.794,358.643,307.794,357.736z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '24',
                    name: 'Красноярский край',
                    path: 'M337.375,116.567c0-0.354,0.314-2.875,0.71-5.514c0.549-3.702,0.903-4.963,1.456-5.356c1.104-0.827,1.614-0.709,2.205,0.473c0.474,0.867,0.788,1.023,1.931,0.984c1.378-0.079,1.417-0.039,2.6,2.639c0.906,1.969,1.101,2.796,0.787,3.072c-0.473,0.354-9.215,4.411-9.532,4.411C337.413,117.276,337.336,116.961,337.375,116.567z M330.324,109.359c-1.772-0.393-3.388-0.827-3.585-0.905c-0.157-0.119-0.63-1.222-1.023-2.403c-0.513-1.733-0.591-2.678-0.355-4.254c0.355-1.891,0.433-2.047,1.891-2.521c2.441-0.788,5.632-0.709,6.853,0.196c1.025,0.75,1.063,0.906,1.182,5.279c0.08,3.82,0,4.49-0.551,4.924c-0.395,0.275-0.787,0.472-0.905,0.472C333.712,110.107,332.135,109.792,330.324,109.359z M322.84,96.637c-1.064-1.181-1.142-1.536-0.866-2.639c0.197-0.709,0.55-2.047,0.787-2.954c0.434-1.733,2.088-4.057,2.875-4.057c0.789,0,3.389,4.411,3.665,6.184c0.433,2.796,0.038,3.505-2.364,4.213C324.141,98.212,324.218,98.212,322.84,96.637z M367.741,198.021c1.183,0.314,2.246,1.062,3.506,2.362l1.813,1.891l1.219,6.498c0.71,3.545,1.262,6.696,1.262,6.973c0,0.235-0.63,1.221-1.379,2.127c-1.653,2.048-1.692,2.6-0.236,3.664c0.945,0.708,1.143,1.18,1.379,3.309c0.197,2.047,0.552,2.953,2.008,5.158c0.985,1.457,1.773,2.914,1.773,3.27c0,0.354-0.354,1.339-0.827,2.243c-0.71,1.381-0.789,2.09-0.591,4.177c0.118,1.416,0.314,2.639,0.473,2.796c0.275,0.276,1.024,0.315,6.38,0.355l3.82,0.078l-2.323,1.535c-1.299,0.867-2.48,1.813-2.64,2.089c-0.158,0.274-0.354,2.521-0.393,5.001l-0.079,4.452l1.299,1.104c1.223,0.984,1.301,1.181,1.065,2.796c-1.065,7.13-0.946,6.655-2.679,8.468c-1.497,1.536-1.734,1.97-1.971,4.176c-0.158,1.379-0.434,2.836-0.552,3.309c-0.314,1.062,1.735,3.507,3.624,4.293c1.615,0.669,1.695,1.694,0.315,4.293c-0.552,1.024-0.984,2.009-0.984,2.167c0,0.195,0.827,0.826,1.813,1.418c1.259,0.747,1.733,1.22,1.614,1.691c-0.118,0.355-0.434,1.262-0.708,2.051c-0.237,0.746-0.513,1.574-0.591,1.85c-0.158,0.592-1.144,0.592-2.481,0.079c-0.513-0.236-1.971-1.024-3.231-1.772c-1.891-1.143-2.52-1.339-3.622-1.143c-1.104,0.197-2.403,0.473-2.68,0.828c-0.276,0.354-0.276,0.709,0,1.259c1.339,2.444,1.339,2.483-1.772,7.169c-2.599,3.979-2.914,4.688-2.914,6.382c0,2.559-0.67,2.441-2.954-0.475c-0.984-1.297-1.97-2.361-2.168-2.361c-0.155,0-0.825,0.63-1.456,1.419c-1.104,1.338-1.34,1.456-3.9,1.692l-2.717,0.236l-1.456,2.756c-0.828,1.498-1.458,3.033-1.497,3.35c0,0.314,0.551,2.008,1.181,3.702c1.339,3.467,1.497,3.033-1.694,6.696l-1.93,2.165l0.592,1.774c0.552,1.613,0.552,2.166,0,5.514l-0.631,3.703l-2.086,1.457c-1.183,0.825-2.129,1.732-2.129,2.047c0,0.316,1.025,1.693,2.284,3.072c1.222,1.418,2.247,2.679,2.247,2.797c0,0.158-1.932,0.827-4.334,1.534l-4.332,1.262l-0.354,1.654c-0.236,1.064-0.71,1.892-1.301,2.286c-0.513,0.313-1.615,1.771-2.441,3.228c-2.601,4.413-4.019,5.437-9.1,6.499c-0.313,0.08-1.97-0.077-3.623-0.314c-2.52-0.354-3.269-0.63-4.137-1.535l-1.102-1.104l2.244-2.05c1.576-1.415,2.364-2.52,2.64-3.544c0.196-0.787,1.022-2.206,1.771-3.112c0.789-0.903,1.42-1.89,1.42-2.204c0-0.276-1.223-2.955-2.719-5.908c-1.458-2.993-2.836-6.145-2.955-7.051c-0.512-2.836-0.787-2.993-4.095-2.325c-4.215,0.908-4.846,0.829-5.87-0.668c-1.379-2.047-1.418-2.402-0.118-3.624c0.985-0.945,1.182-1.457,1.182-2.875c0-1.419-0.315-2.205-1.732-4.216l-1.734-2.48l0.709-1.103c0.473-0.708,0.67-1.496,0.512-2.284c-0.158-1.024,0.118-1.614,1.418-3.27c1.3-1.613,1.615-2.323,1.615-3.623c0-1.498-0.079-1.615-1.457-1.97c-5.279-1.376-4.845-1.143-4.845-2.718c0-1.813,0.158-2.009,2.482-3.584c2.047-1.417,2.127-1.694,1.221-3.979c-0.592-1.495-0.709-1.573-2.325-1.573c-1.615,0-1.812-0.158-3.742-2.563c-2.285-2.795-2.285-2.795-7.799-3.189c-4.45-0.314-5.238-0.825-4.056-2.639c0.748-1.18,0.748-1.219-0.119-3.545c-0.59-1.692-0.709-2.401-0.354-2.521c0.708-0.275,6.578-4.529,6.893-5.001c0.512-0.749,0.354-0.945-2.206-2.442c-1.891-1.102-2.718-1.852-3.23-2.995c-0.788-1.731-0.708-1.851,2.797-5.63c2.364-2.562,2.48-3.073,1.536-5.87c-0.63-1.853-0.63-1.853,0.473-3.427c1.93-2.678,2.126-3.229,2.126-6.342c0-3.584-0.472-4.333-3.229-5.04c-2.087-0.551-1.891-0.079-2.087-5.121c-0.039-1.222-0.118-2.402-0.158-2.679c0-0.275-0.631-0.789-1.378-1.063l-1.3-0.552l-0.275-4.018c-0.275-3.387-0.473-4.294-1.418-5.868c-0.709-1.222-1.26-2.954-1.575-4.885c-0.395-2.679-0.354-3.072,0.354-4.451c0.709-1.378,2.364-3.899,2.757-5.042c0.394-1.142,0.275-1.731-0.984-5.316l-1.458-4.018l-1.418,0.275c-2.796,0.513-2.875,0.474-4.609-1.969c-0.945-1.3-1.693-2.482-1.732-2.64c0-0.158,1.064-1.023,2.363-1.969c2.481-1.813,3.387-3.31,3.781-6.381c0.236-1.498,0.078-1.812-1.379-3.584c-0.866-1.103-1.615-2.167-1.615-2.364c0-0.236,0.906-1.339,2.01-2.481l2.008-2.088l0.63,0.867c1.34,1.89,2.049,2.363,3.545,2.245l1.458-0.118l0.119-2.442c0.118-2.324,0.078-2.481-1.813-4.923c-1.023-1.378-2.008-2.796-2.166-3.191c-0.276-0.748,0.433-6.577,0.867-7.05c0.118-0.157,3.269-0.552,6.932-0.905c9.61-0.906,10.042-0.985,10.318-1.655c0.12-0.355-0.235-1.537-0.787-2.718l-1.023-2.087l1.654-2.442c0.906-1.378,2.56-3.505,3.701-4.727c1.773-1.89,2.718-2.48,6.854-4.333c3.427-1.536,4.923-2.403,5.2-3.072c0.393-0.788,3.622-2.797,4.568-2.797c0.197,0,0.553,0.512,0.828,1.142c0.867,2.126,1.142,2.126,5.474,0.041l4.019-1.97l-0.118-1.457c-0.118-1.34-0.04-1.458,1.259-1.812c2.286-0.592,2.482-0.985,1.932-3.703l-0.474-2.363l1.933-3.072c1.062-1.694,2.283-3.31,2.714-3.584c0.946-0.709,2.602-0.709,3.468-0.079c0.59,0.472,0.513,0.669-0.945,2.363c-2.245,2.64-1.931,3.23,1.575,2.876c2.602-0.276,2.717-0.237,2.953,0.629c0.119,0.512,0.236,1.3,0.236,1.773c0,0.709,0.671,1.339,1.42,1.339c0.077,0,1.024-0.828,2.126-1.772l2.009-1.772h3.545h3.546l2.56,2.048c1.457,1.142,2.679,2.481,2.796,3.033c0.159,0.551,0.276,2.797,0.315,4.963v3.939l-2.6,3.938c-1.418,2.167-3.507,5.593-4.646,7.601c-1.145,2.049-2.836,4.963-3.822,6.5c-1.693,2.756-2.086,3.938-1.379,4.373c0.236,0.118,1.379,0.118,2.641-0.041c2.126-0.236,2.441-0.433,5.632-3.348c1.851-1.693,3.506-3.072,3.664-3.072c0.314,0,0.433,0.315,1.337,4.451c0.631,2.717,0.867,3.23,2.207,4.293c0.866,0.63,2.718,2.994,4.215,5.199c4.135,6.184,4.016,5.357,1.221,8.508c-2.678,3.033-2.953,3.702-3.348,7.957c-0.355,3.742-0.553,4.057-2.481,3.899c-1.419-0.079-1.655,0.079-4.333,2.875L367.741,198.021z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '29',
                    name: 'Архангельская область',
                    path: 'M145.952,226.773c-0.552-0.197-1.498-0.354-2.088-0.354c-0.709-0.04-1.457-0.435-1.93-1.064c-0.709-0.865-0.985-0.984-2.324-0.746l-1.535,0.236v-1.538c0-1.221-0.159-1.614-0.75-1.771c-0.433-0.12-1.143-0.946-1.575-1.813c-0.827-1.614-1.615-1.969-2.757-1.261c-0.275,0.158-0.984,0.197-1.576,0.041c-0.827-0.197-1.063-0.552-1.221-1.813c-0.158-1.26-0.354-1.534-0.984-1.457c-0.434,0.078-1.576,0.236-2.56,0.354c-1.694,0.236-1.852,0.158-2.836-1.142c-0.669-0.867-2.126-1.852-4.018-2.757c-2.285-1.104-3.033-1.655-3.23-2.441c-0.157-0.591-0.59-1.104-1.182-1.222c-1.103-0.276-6.065-5.435-6.065-6.302c0-0.315,0.434-1.655,0.985-2.915c0.551-1.301,0.985-2.6,0.985-2.955c0-0.315,0.709-0.945,1.535-1.378c1.379-0.669,1.616-1.024,1.97-2.797c0.236-1.141,0.867-2.559,1.417-3.189c0.907-1.102,0.945-1.182,0.395-2.994c-0.985-3.229-0.788-4.254,1.338-7.089c0.828-1.064,1.221-1.261,2.639-1.261c1.3,0,1.694,0.157,1.852,0.749c0.157,0.708,2.402,2.402,3.111,2.402c0.434,0,3.072-2.402,3.505-3.191c0.236-0.472,0.197-1.298-0.118-2.441c-0.552-2.088-0.08-4.924,0.945-5.554c1.063-0.67,1.458,0.04,1.852,3.624l0.354,3.269l2.521,2.639c3.309,3.466,3.938,3.544,5.002,0.591c1.969-5.475,2.678-5.986,8.508-5.986c5.081,0.039,5.199,0.078,6.538,3.309c1.615,3.741,2.009,4.096,3.507,3.229l1.142-0.709l2.797,5.317l2.796,5.317l2.442-0.236c1.772-0.157,2.638-0.039,3.19,0.355c0.669,0.512,0.63,0.669-0.828,3.663l-1.575,3.151l0.866,2.836c0.748,2.364,0.788,2.954,0.394,3.544c-0.473,0.59-0.709,0.63-2.324,0.196c-0.985-0.274-2.521-0.472-3.427-0.472c-1.339,0-1.851-0.276-3.505-1.891c-1.064-1.023-3.073-2.481-4.49-3.229c-2.404-1.262-2.64-1.3-4.137-0.867c-0.905,0.276-1.615,0.748-1.615,1.024c0,0.276,0.552,1.694,1.182,3.072c1.025,2.205,1.143,2.717,0.788,3.704c-0.275,0.63-0.355,1.93-0.236,2.953c0.276,2.008,0.354,1.93-2.166,2.441c-0.828,0.197-1.143,0.67-1.93,3.229l-0.945,2.994l1.181,0.945c1.576,1.3,2.206,1.223,3.663-0.591c1.063-1.338,1.497-1.574,2.757-1.574c1.182,0,1.654,0.197,2.127,0.903c0.591,0.907,0.513,1.025-2.717,4.255c-2.875,2.797-3.309,3.467-3.151,4.334C150.875,226.655,148.866,227.68,145.952,226.773z M214.052,164.936c-1.693-1.3-3.111-2.757-3.23-3.23c-0.117-0.512-0.59-2.875-1.023-5.278c-0.748-3.82-0.748-4.569-0.315-5.908c0.433-1.26,0.827-1.654,2.048-2.048c0.906-0.316,2.915-1.852,5.238-4.057c3.309-3.111,3.899-3.505,4.845-3.308c0.945,0.197,1.26-0.041,2.914-2.166c0.986-1.3,2.639-2.916,3.664-3.625c1.024-0.709,3.545-2.521,5.593-4.057c2.048-1.576,4.215-3.112,4.766-3.506c1.22-0.788,9.177-2.048,16.661-2.639c3.112-0.236,6.736-0.789,8.35-1.221c1.576-0.472,3.111-0.709,3.466-0.591c1.103,0.433,0.709,2.482-0.748,3.939c-1.498,1.497-1.498,1.497-10.281,2.442c-6.38,0.669-8.192,1.339-13.471,4.845c-1.22,0.788-3.308,1.89-4.568,2.403c-1.261,0.551-3.506,1.929-4.924,3.072c-1.417,1.182-4.017,3.19-5.75,4.491c-3.309,2.441-7.444,6.853-9.138,9.728c-0.984,1.655-0.984,1.852-0.788,6.5c0.118,2.64,0.276,5.12,0.354,5.553C217.951,167.613,217.085,167.299,214.052,164.936z m 49.1,-91.55 0,-1.772863 -1.2049,-0.354571 -0.60246,1.489203 0,2.127436 z m -6.62697,-6.31139 -0.60246,1.772861 1.80736,0.354573 0.60245,-2.127434 z m 6.62697,0.283658 1.80736,1.205546 0.60246,-0.709145 -1.20491,-1.560119 z m -3.01227,3.191152 0,0.567316 1.20491,-0.921889 -0.60245,0 z m -0.60244,-5.673161 0,-0.567316 -0.60246,-0.07091 0,0.78006 0,0.921888 0,0 z m 0.60244,0.78006 -0.60244,0.567317 0,0.567316 0,0.921888 1.2049,-1.41829 0,-0.425487 z m 3.61472,0.07091 0.60246,-0.567316 -1.80736,-2.340179 -0.60245,1.205547 0.60245,1.205547 z m -12.6515,3.049324 0,0.496401 0.60245,0.425487 0.60246,-0.992803 0,-1.134632 -1.20491,-0.07091 z m 0.60245,-4.254871 -1.20491,0.921888 0.60246,0.850975 0.60245,-0.78006 z m -4.81962,-10.282602 0,0.921888 0.60245,0.141829 0,0.354572 0,0.567317 0,0.567315 1.80736,-0.07091 1.2049,-0.425487 0.60246,-0.141829 0,0.07091 0.60245,0.14183 0.60246,1.772862 0.60244,-0.567316 0,-1.56012 -0.60244,-1.489204 -1.20491,0 -1.20491,0.141829 -0.60245,-0.07091 -0.60245,-0.141829 -1.20491,-0.638231 z m 9.63925,3.049323 0,-0.425487 -0.60246,0.212744 -1.2049,0.283657 -0.60246,0.283658 0,0.78006 0,0.850974 -2.40981,0.07091 -1.80736,-0.567316 0,0.496403 0.60245,0.63823 -0.60245,0 -0.60245,-0.354572 0,0.425486 0,0.567317 0,0.141829 -0.60245,0 0,-1.205547 -1.20491,-0.212743 -0.60245,0.992803 0,1.063717 1.2049,-0.07091 0,0.921888 -0.60245,0.425488 -0.60245,0.425488 0.60245,0.212742 0.60245,-0.07091 0.60246,0.567317 0.60245,-0.638229 0,0 0,0.425486 0.60245,0.07091 0,0 0.60245,-1.063717 -0.60245,-0.78006 0,-0.07091 1.80736,0.212744 0.60246,0.709144 0.60244,-0.496402 1.20491,-0.425486 3.61472,-0.212744 -0.60245,-1.489204 -1.20491,-0.496402 0,-0.141829 0.60246,-0.496402 0.60245,-0.07091 0.60245,-0.709144 0,-0.283659 0,0 -1.2049,0 0,-0.496402 z m 1.80735,-1.914691 -0.60245,0.638229 0.60245,0.212745 1.20491,-0.283658 0,-0.709145 -0.60246,-0.354572 z m 21.6883,7.516938 1.20491,1.27646 0.60246,-1.134631 -1.20491,-1.347377 z m -4.81962,10.920832 1.20491,1.347376 2.4098,0.141828 1.80737,-1.843776 0,-0.14183 0.60245,-2.411092 -1.20491,-0.709145 -0.60245,1.063718 -0.60246,0.921888 -0.60244,-0.141829 -1.80736,0.283658 z m -8.43434,4.538529 -0.60245,-0.850975 -1.20491,1.205547 1.20491,1.063717 z m 0,-5.673161 -3.01227,-0.425487 0,2.19835 0,1.560119 0.60246,0 0,-0.425487 0.60245,0.07091 0.60246,-0.283658 -0.60246,-0.496402 0,-0.354573 0,-0.07091 1.80736,0.283657 0.60246,-1.205545 z m 2.40982,-0.709145 -0.60245,0.709145 0,0.850975 0,0.850974 0.60245,0.141828 0,-0.07091 0.60245,-0.07091 0,0.709145 0.60246,0.992802 1.80736,-0.709145 1.80735,-1.631033 0.60245,-1.063718 0,-1.134632 -0.60245,-0.425487 -1.20491,0 -1.20491,-0.921889 -1.20489,-0.354572 z m -1.20491,-3.829383 0.60246,1.063717 1.2049,-0.425486 -0.60245,-1.063718 z m -1.20491,1.843777 -0.60245,-0.354572 -0.60245,0.780059 0.60245,0.212744 z m 0,-6.027732 -0.60245,-0.850974 -0.60245,-0.709145 -0.60246,-0.709146 0,-0.709146 -0.60245,0.212745 -0.60246,0.496401 0.60246,1.489205 0.60245,1.772862 0.60246,2.127436 1.80736,1.134632 z m 1.20491,-0.496402 -0.60245,-0.850974 -0.60246,0.07091 0.60246,1.489206 0,1.631034 0.60245,1.276461 0.60246,0.141829 0,-2.907495 z m 1.80736,0.141829 0.60246,-0.850974 -1.20491,-0.07091 -0.60245,0.78006 z m 4.21717,6.098647 1.2049,-1.347376 -1.2049,-0.63823 -1.80735,1.134631 z m -0.60245,-8.226082 -0.60246,0.425487 0,1.134633 0.60246,-0.425488 z m 2.4098,-5.247673 -1.2049,-0.283658 0,-0.212744 -0.60245,0.07091 0,0.638231 -0.60245,0.709144 1.2049,0.638231 1.80736,-0.921889 z m -4.81961,2.269263 0,2.056521 1.80735,0.354574 -0.60244,-2.411095 z m -3.01227,1.56012 0,-0.850973 -0.60245,0.283657 0,1.701948 1.20491,0.709145 1.80736,0 0.60245,0.141829 0,-0.141829 -0.60245,-1.914692 -1.80736,0.638231 z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '52',
                    name: 'Нижегородская область',
                    path: 'M95.929,263.089c-0.631-1.261-1.024-2.797-1.182-4.806l-0.197-2.914l-2.402-0.709c-2.403-0.709-4.018-2.127-3.584-3.231c0.118-0.236,2.717-1.574,5.79-2.993c4.372-2.007,5.712-2.796,6.145-3.663c0.669-1.219,0.591-1.219,2.56-0.628c1.378,0.393,1.576,0.354,2.639-0.514c0.985-0.827,1.733-1.023,4.49-1.222c1.852-0.117,3.703-0.434,4.176-0.749c0.788-0.471,1.063-0.392,2.678,0.475c0.984,0.551,3.19,2.126,4.923,3.505c3.073,2.403,3.113,2.52,2.442,3.27c-0.669,0.709-2.047,0.749-3.82,0.078c-0.314-0.118-1.378,0.671-2.402,1.773l-1.852,1.969l-1.063-0.788c-0.985-0.749-1.103-0.749-3.584-0.079l-2.56,0.71l-0.118,2.678c-0.118,2.561-0.157,2.68-1.261,3.072c-1.103,0.395-1.182,0.552-1.182,2.48c0,1.813-0.118,2.129-1.023,2.603c-0.906,0.509-1.064,0.47-1.537-0.12c-0.629-0.906-0.906-0.865-3.82,0.512c-1.339,0.631-2.679,1.182-2.875,1.182C97.071,264.979,96.441,264.111,95.929,263.089z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '65',
                    name: 'Сахалинская область',
                    path: 'M573.21,247.474l-0.707,0.177l-0.528-1.499v-1.323l2.292,0.617l1.146,0.529l0.619,1.411l1.234,1.234l2.204,0.441l0.529,1.411l2.468,1.588h1.324l1.058,1.498l0.882,2.382l1.366,1.366l2.602,2.691l1.675,0.44l2.294,0.882l2.204,1.94l2.999,1.675l1.939,1.675l2.559,1.323l2.203,1.323l1.411,1.146l2.47,0.971l-0.354,1.146l-0.88,0.882l-1.676,0.529h-1.324l0.354,1.851l-0.354,1.323v1.058l1.501,2.293c0,0,1.411,1.586,1.146,1.851c-0.267,0.265,0.088,2.734,0.088,2.734l1.146,1.147l1.765,1.764l1.499,0.97h2.293l1.323,1.322h1.499l0.792,1.675l1.941,0.089l1.189-1.191l2.072,1.191l1.235,1.587c0,0,0.442,1.058,0,1.058c-0.44,0-2.822-1.147-2.822-1.147l-1.013,1.014h-2.249l-0.706,1.808l0.442,1.763l1.41,1.411l1.058,2.292l-1.411,1.147l-1.146-1.411l-1.498-1.5l-2.646-2.469v-1.676l-1.764-1.762l-1.674-1.676l-1.147-1.499l-1.411-2.734l-1.763-1.675l-1.854-1.058l-1.763-0.529l-1.5-3.174l-3.263-4.497l-2.646-2.646l-2.203-2.204l-1.94-2.645l-1.235-2.029l-3.35-1.499l-2.646-1.146l-1.587-0.177l-2.117-2.91v-1.323l-2.293-2.293l-1.234-2.293l-2.47-0.793l0.618-1.765v-1.322l2.027,0.617l0.354-1.764l-1.19-1.19v-0.662l-1.169-1.169L573.21,247.474z M647.724,293.505l0.354,1.851l0.176,1.765l0.707,0.264v-1.411l0.528-1.146v-1.588L647.724,293.505z M653.81,294.563v0.793l1.147,0.618v-1.323L653.81,294.563z M650.194,287.42l1.059,0.44l0.353-1.41l-0.529-2.821l0.97-0.97l-0.175-2.03l-1.501-0.44l-0.44,2.292l0.573,0.572l-0.485,1.72L650.194,287.42z M652.84,275.779l-0.441,0.44l0.353,1.5l0.706-1.059L652.84,275.779z M655.045,270.664l0.616-1.411l-0.353-1.94l0.264-1.675l-0.307-1.633l-1.191,1.191l-0.352,1.5l0.615,1.41l-0.439,2.293L655.045,270.664z M644.111,211.14l-0.529,1.586l-0.838,0.838l0.97,0.97l0.573,1.191l-0.176,1.587l-0.089,2.028l0.926,0.927l1.014-0.574v-2.117l0.926-0.926l-0.749-1.809l-1.235-1.233l0.088-1.587L644.111,211.14z M647.902,224.896v1.323l0.881,0.441l0.619-0.793L647.902,224.896z M655.046,250.734v1.941v1.587h1.234l-0.353-1.5v-0.97v-1.146L655.046,250.734z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '40',
                    name: 'Калужская область',
                    path: 'M50.91,239.456c-1.852-0.63-1.931-0.71-1.733-1.891c0.118-0.709,0.748-2.009,1.417-2.913c1.104-1.538,1.182-1.853,0.985-3.94c-0.236-1.931-0.157-2.284,0.433-2.52c0.473-0.197,1.064,0.038,1.773,0.706c0.985,0.986,1.182,1.026,4.766,0.789c2.049-0.118,4.136-0.275,4.687-0.354c0.788-0.118,1.142,0.118,1.655,0.985c0.394,0.67,0.945,1.182,1.26,1.182c0.866,0,1.812,1.575,1.812,3.072c0,0.984-0.315,1.614-1.221,2.481c-1.378,1.298-2.245,1.379-4.766,0.512l-1.812-0.629l-2.56,1.613C54.848,240.323,53.902,240.441,50.91,239.456z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '34',
                    name: 'Волгоградская область',
                    path: 'M72.927,311.692c-0.591-1.378-1.3-1.654-5.16-1.93c-1.3-0.119-5.081,0.552-5.593,0.985c-0.513,0.433-0.63,0.234-1.063-1.774c-0.315-1.416-0.788-1.339-2.245,0.317c-1.182,1.299-1.34,1.378-3.899,1.378c-3.585,0-4.53-0.434-5.121-2.207c-0.354-1.102-0.354-1.812,0-3.111c0.394-1.418,0.355-1.891-0.197-2.953c-0.905-1.773-0.433-2.088,3.27-2.167c1.614,0,1.732-0.118,2.757-1.93l1.023-1.892l-0.826-1.495l-0.867-1.498l1.615-1.338l1.654-1.38l-0.512-2.324c-0.275-1.298-0.59-2.676-0.669-3.109c-0.158-0.591,0.157-0.985,1.26-1.575c1.418-0.789,1.852-1.262,2.285-2.68c0.157-0.552,0.669-0.671,2.561-0.671c1.299,0,2.48,0.198,2.638,0.434c0.118,0.198,0.788,0.75,1.458,1.144c0.629,0.395,1.654,1.575,2.205,2.599c0.985,1.813,1.143,1.931,3.9,2.718c1.575,0.434,3.033,1.064,3.269,1.38c0.433,0.747,0.473,3.388,0,4.961c-0.473,1.617,0.04,2.364,1.772,2.68c1.024,0.195,1.615,0.629,2.206,1.655c0.472,0.787,1.378,1.652,2.008,1.929c0.827,0.314,1.339,0.946,1.694,1.97c0.276,0.825,0.434,1.653,0.315,1.812c-0.079,0.157-1.654,1.103-3.466,2.087c-3.782,2.049-4.057,2.325-4.253,4.097c-0.079,1.024-0.434,1.459-1.773,2.246l-1.654,0.984L72.927,311.692z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '67',
                    name: 'Смоленская область',
                    path: 'M43.426,228.27c-1.183-0.669-0.867-5.002,0.669-9.729c1.261-3.78,1.536-4.293,3.703-6.46c2.324-2.324,2.363-2.324,3.702-1.852c1.103,0.395,1.812,1.184,3.623,4.177l2.285,3.702h2.915h2.915l1.575,2.008c0.867,1.103,1.576,2.128,1.576,2.323c0,0.434-2.324,4.768-2.914,5.398c-0.316,0.315-2.009,0.63-4.451,0.747l-3.979,0.274l-0.984-1.14l-0.985-1.144l-1.891,0.867C49.098,228.349,44.45,228.859,43.426,228.27z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '26',
                    name: 'Ставропольский край',
                    path: 'M36.178,343.006c-1.102-0.119-1.102-0.315-0.118-1.812c1.063-1.654,1.024-1.931-0.669-2.719c-0.828-0.394-2.915-1.496-4.687-2.48c-2.955-1.694-3.191-1.932-3.545-3.545c-0.354-1.498-0.314-1.693,0.276-1.693c1.261,0,1.182-0.748-0.197-2.837c-0.787-1.142-1.417-2.402-1.417-2.796c0-0.985,0.709-2.324,1.654-3.073c0.788-0.631,0.788-0.67,0.118-2.835c-0.669-2.088-0.669-2.245-0.039-3.229c0.473-0.711,0.945-0.985,1.733-0.946c0.59,0.039,1.497-0.116,2.008-0.393c0.827-0.473,1.064-0.395,2.561,1.102c1.181,1.144,1.891,1.535,2.363,1.379c0.473-0.196,0.749-0.039,0.906,0.552c0.158,0.709,0.512,0.866,1.852,0.866c1.536,0,1.693,0.078,3.15,2.403c1.025,1.534,1.734,3.267,2.049,4.804c0.236,1.341,1.103,3.703,1.852,5.24c1.811,3.661,2.402,5.711,1.732,6.301c-0.236,0.236-1.693,1.103-3.23,1.931c-3.544,1.891-3.82,2.128-3.584,3.112c0.197,0.748,0.04,0.826-1.85,0.826C37.951,343.163,36.651,343.085,36.178,343.006z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '73',
                    name: 'Ульяновская область',
                    path: 'M100.144,287.627c-1.064-0.315-2.64-1.023-3.506-1.615l-1.615-1.023l2.284-2.047l2.324-2.051l-0.512-2.363c-0.276-1.298-0.434-3.031-0.355-3.898l0.118-1.574l2.127-0.119c1.93-0.119,2.127-0.236,2.521-1.3c0.236-0.631,0.63-1.142,0.867-1.142c0.906,0,2.126,1.22,2.245,2.246c0.079,0.59,0.395,1.103,0.709,1.141c4.372,0.59,4.333,0.59,4.923,1.734c0.513,0.942,0.867,1.181,2.009,1.181c1.221,0,1.458,0.156,2.009,1.457c0.315,0.828,0.984,1.891,1.417,2.401l0.867,0.907l-1.852,1.771l-1.891,1.774l-2.087-1.616c-1.969-1.458-2.284-1.575-4.648-1.575c-1.378,0-3.19,0.197-4.056,0.434l-1.497,0.395l0.236,2.717C103.098,288.533,103.215,288.455,100.144,287.627z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '54',
                    name: 'Новосибирская область',
                    path: 'M250.012,309.291c-0.039,0-0.078,0-0.078,0c-0.197,0.118-0.394,0.825-0.394,1.496c0,0.788-0.355,1.574-0.985,2.245l-1.024,1.103l0.828,1.379c0.983,1.693,0.788,1.852-2.797,2.796l-2.6,0.669l-0.865,3.032l-0.868,2.994l1.34,1.971c1.497,2.086,1.497,2.284,0.079,5.514l-0.631,1.536l0.868-0.199c0.512-0.115,1.771-0.47,2.835-0.746c1.497-0.434,1.891-0.395,2.283,0c0.395,0.395,0.395,0.746-0.314,2.008c-0.511,0.828-0.905,1.813-0.905,2.089c0,0.276,1.142,1.771,2.481,3.427c0.63,0.787,1.142,1.339,1.576,1.969c1.771-0.709,3.624-1.063,5.553-1.378c3.15-0.514,5.476-1.142,8.468-2.403l4.136-1.772l2.166,2.443c1.182,1.338,2.797,3.189,3.623,4.056l1.458,1.616l2.008-2.011l2.009-2.086l3.545-0.278c4.096-0.313,5.869-1.297,5.869-3.267c0-1.892-1.301-12.054-1.577-12.407c-0.157-0.159-1.417,0.234-2.756,0.944c-1.34,0.671-2.6,1.104-2.796,0.946c-0.198-0.197-0.591-1.774-0.946-3.506c-0.315-1.693-0.747-3.229-0.906-3.389c-0.157-0.156-1.771-0.038-3.583,0.198c-2.954,0.355-3.348,0.274-3.822-0.315c-0.314-0.473-1.496-0.789-3.229-1.064l-2.758-0.394l-1.378-2.284c-0.709-1.221-1.851-2.56-2.561-3.032C262.026,312.243,251.194,309.133,250.012,309.291z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '66',
                    name: 'Свердловская область',
                    path: 'M190.025,296.056c-0.551-0.827-4.411-2.324-6.065-2.324c-0.433,0-1.497,0.354-2.403,0.827l-1.575,0.867l-1.536-1.063c-0.866-0.552-1.772-1.024-2.009-1.024c-0.394,0-1.576-0.512-6.341-2.64c-0.828-0.354-1.3-0.825-1.3-1.299c0-1.143-0.709-1.339-2.323-0.631l-1.498,0.668l-2.599-1.415c-2.836-1.576-2.836-1.576-2.088-4.727l0.434-1.971l2.167-0.196c2.127-0.197,2.167-0.237,3.112-2.088c0.945-1.97,1.221-2.088,3.584-1.536c1.929,0.473,2.324,0.236,2.6-1.574c0.275-1.656,0.078-1.498,4.411-3.309c1.104-0.474,1.261-0.75,1.182-1.853c-0.04-0.747,0.237-1.731,0.591-2.284c0.867-1.222,0.827-2.008-0.118-3.821c-1.103-2.047-1.024-3.151,0.315-3.703c1.023-0.472,3.899-3.267,6.539-6.418c0.748-0.906,1.457-2.285,1.614-3.151c0.315-1.852,1.261-3.821,2.009-4.253c0.315-0.197,0.552-0.631,0.552-1.025c0-0.394,0.236-1.023,0.55-1.458c0.552-0.747,0.592-0.708,0.986,0.435c0.708,1.969,1.023,2.322,2.915,3.347c1.496,0.789,2.205,1.616,4.057,4.688l2.245,3.664l-0.867,3.7l-0.826,3.663l0.865,1.734c0.788,1.694,0.788,1.851,0.236,4.174l-0.63,2.404l1.182,0.983c0.631,0.512,1.3,0.984,1.417,0.984c0.158,0,0.789,0.434,1.379,0.985c0.905,0.865,1.064,1.3,1.064,3.27c0.039,1.219,0.275,2.677,0.59,3.229c0.315,0.512,0.591,1.89,0.591,2.993v2.008l-1.457,0.237c-2.285,0.394-3.86,0.314-4.333-0.198c-0.708-0.667-3.269,5.161-3.269,7.406c0,0.946-0.079,1.733-0.197,1.733c-0.119,0-0.749-0.277-1.418-0.631c-1.103-0.551-1.22-0.551-2.481,0.436l-1.299,0.981L190.025,296.056z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '04',
                    name: 'Республика Алтай',
                    path: 'M301.571,385.977c-1.063-0.119-1.537-0.513-2.442-1.969c-0.669-0.986-1.26-2.126-1.378-2.48c-0.315-0.986-1.142-1.183-2.363-0.553c-1.104,0.593-4.371,0.708-6.105,0.237c-1.023-0.276-6.419-7.445-6.065-8.035c0.118-0.157,0.629-0.275,1.141-0.275c0.788,0,1.064-0.317,1.459-1.615c0.393-1.38,0.393-1.694-0.12-1.972c-2.166-1.259-2.126-1.298,1.34-2.441c3.23-1.062,3.387-1.181,4.963-3.427c1.733-2.48,2.009-2.599,4.45-2.008c1.734,0.395,2.049,0.118,2.482-2.125c0.512-2.955,0.552-2.995,4.096-2.208c1.695,0.395,3.27,0.828,3.506,0.985c0.63,0.355,0.119,1.458-1.182,2.599c-1.102,0.907-1.142,1.104-1.023,3.703l0.118,2.757l1.734,0.513c1.496,0.394,1.89,0.394,2.599-0.079c0.827-0.512,0.906-0.434,2.088,2.09c0.668,1.456,1.616,3.307,2.088,4.094l0.906,1.498l-1.103,1.14l-1.143,1.184l1.221,1.377c1.181,1.341,1.3,2.365,0.353,2.681c-0.275,0.118-1.969,0.513-3.78,0.946c-2.915,0.667-3.427,0.904-4.491,2.205c-0.668,0.824-1.378,1.455-1.614,1.416C303.066,386.177,302.28,386.095,301.571,385.977z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '71',
                    name: 'Тульская область',
                    path: 'M60.559,251.547c-0.354-0.63-0.788-1.141-0.945-1.141c-0.197,0-0.315-0.63-0.315-1.379c0-0.984-0.354-1.772-1.22-2.758c-1.064-1.221-1.261-1.732-1.3-3.662l-0.04-2.205l1.773-1.104l1.771-1.103l2.324,0.669c2.285,0.63,2.363,0.63,3.781-0.198l1.497-0.863l1.103,2.48c1.261,2.836,1.261,2.914,0.473,4.883c-2.324,5.634-2.206,5.476-5.987,6.774l-2.246,0.788L60.559,251.547z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '03',
                    name: 'Республика Бурятия',
                    path: 'M391.099,369.197l-3.544-0.865l-1.222-3.467c-0.708-1.892-1.339-3.505-1.418-3.623c-0.315-0.276-16.543-3.781-17.961-3.861c-1.851-0.118-2.561-1.18-2.324-3.386c0.157-1.222,0.474-1.97,1.144-2.442c1.063-0.827,0.984-0.75,2.914-2.993c1.772-2.047,2.993-2.128,3.309-0.276c0.197,1.063,0.669,1.418,5.119,3.624c3.388,1.653,5.396,2.441,6.46,2.441c1.104,0,2.245,0.473,3.82,1.498c2.047,1.3,2.284,1.614,2.207,2.678c-0.079,1.063,0.039,1.184,1.3,1.3c0.906,0.08,1.653,0.432,2.244,1.142l0.866,1.064l1.813-0.907c2.285-1.142,2.954-1.851,2.954-3.071c0-0.671,0.826-1.933,2.521-3.82c1.379-1.535,2.717-3.468,2.954-4.215c0.394-1.182,3.427-4.964,8.35-10.319c0.433-0.473,0.826-2.009,1.103-4.333c0.907-7.877,0.946-8.822,0.316-9.808c-0.316-0.51-1.104-2.48-1.695-4.372c-1.102-3.426-1.102-3.465-0.471-5.83c0.706-2.639,0.865-2.283-1.932-4.567c-1.339-1.063-0.787-2.325,1.496-3.506c1.379-0.709,1.931-1.222,2.128-2.088c0.236-1.063,0.354-1.142,3.072-1.378c2.914-0.236,3.82-0.788,3.82-2.284c0-0.828,0.394-0.867,2.481-0.314c1.26,0.353,1.654,0.314,2.205-0.198c0.945-0.828,1.419-0.748,1.931,0.395c0.513,1.101,0.551,1.101,3.859,0.551c2.01-0.354,2.836-0.747,4.254-2.009c1.459-1.26,1.812-1.851,2.049-3.388c0.198-1.417,0.59-2.166,1.693-3.151c2.088-1.929,3.229-1.652,1.615,0.395c-1.143,1.498-0.986,3.071,0.708,6.302c2.64,5.081,4.255,7.288,5.477,7.562c0.59,0.12,2.047,0.788,3.188,1.419c1.932,1.104,2.049,1.3,2.049,2.717c0,1.301-0.158,1.576-1.183,2.01c-1.376,0.551-3.661,3.151-6.732,7.64c-1.183,1.695-2.326,3.39-2.602,3.742c-0.828,1.104,0.275,4.059,1.772,4.728c2.206,0.984,2.01,2.482-0.865,5.908c-1.184,1.457-2.64,2.599-4.452,3.545c-2.481,1.299-2.679,1.536-2.993,3.033c-0.236,1.221-0.709,1.931-1.851,2.875c-0.867,0.67-1.929,1.969-2.364,2.796c-0.748,1.459-0.905,1.577-2.482,1.577c-1.258,0-2.086,0.274-3.346,1.182c-1.063,0.825-1.891,1.142-2.404,0.984c-1.023-0.316-3.584,0.944-3.584,1.812c0,0.394,0.197,1.142,0.434,1.654c0.395,0.824,0.314,1.183-0.394,2.166c-1.221,1.733-1.063,2.677,0.591,3.544l1.419,0.71l-1.38,0.946c-1.023,0.708-1.458,1.298-1.613,2.441c-0.276,1.732-0.513,1.771-4.688,0.827c-2.127-0.473-3.781-0.552-6.695-0.394l-3.901,0.275l-3.071,2.166c-1.811,1.261-3.465,2.126-3.976,2.126C395.078,370.063,393.067,369.673,391.099,369.197z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '10',
                    name: 'Республика Карелия',
                    path: 'M109.755,192.742c-1.143-1.221-1.576-1.378-4.136-1.614l-2.875-0.276l-2.718-3.703c-1.497-2.009-2.954-3.701-3.189-3.701c-0.276,0-0.906,0.433-1.379,0.984c-0.827,0.945-2.008,1.182-3.702,0.748c-0.669-0.197-1.575-1.812-3.86-7.011c-1.654-3.702-2.994-6.972-2.994-7.247c0-0.355,0.789-0.473,2.679-0.473c3.229,0,13.47-1.813,14.1-2.482c0.276-0.275,0.75-2.324,1.103-4.607c0.355-2.285,0.788-4.255,0.946-4.452c0.197-0.157,1.103-0.512,2.087-0.787c1.655-0.473,1.851-0.709,3.899-4.373c1.97-3.506,2.363-3.979,4.53-5.239c3.032-1.773,3.86-2.56,5.79-5.357c0.827-1.221,1.693-2.245,1.89-2.245c0.236,0,1.3,0.63,2.402,1.418c1.852,1.338,1.97,1.536,1.733,2.677c-0.59,2.482-0.039,3.782,1.615,3.782c1.064,0,1.103,0.197,1.772,4.882l0.473,3.546l-1.103,0.788c-2.324,1.655-4.058,3.426-6.303,6.381l-2.323,2.993l0.748,3.584c0.395,1.969,0.788,3.899,0.907,4.293c0.157,0.59-0.08,0.709-1.616,0.709c-1.654,0-1.851,0.117-3.387,2.087c-1.537,1.969-1.615,2.245-1.576,4.648c0.039,1.378,0.157,2.954,0.314,3.505c0.237,0.708,0.08,1.261-0.551,2.009c-0.512,0.59-1.024,1.89-1.142,2.875c-0.237,1.458-0.512,1.93-1.418,2.403c-0.63,0.315-1.221,0.591-1.26,0.591C111.133,194.082,110.463,193.451,109.755,192.742z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '70',
                    name: 'Томская область',
                    path: 'M282.547,322.366l-0.591-3.23h-3.743c-2.284,0-3.978-0.196-4.332-0.473c-0.315-0.235-1.694-0.59-3.034-0.747c-2.717-0.314-2.717-0.314-4.412-2.992c-1.614-2.602-3.308-3.508-9.846-5.241c-3.151-0.826-5.908-1.613-6.223-1.771c-0.315-0.158-1.261-2.247-2.088-4.609c-1.496-4.057-1.536-4.37-1.102-6.381c0.394-1.654,0.984-2.678,3.072-5.158c2.443-2.955,2.678-3.112,4.215-3.151c0.905,0,1.851-0.238,2.087-0.552c0.236-0.276,1.221-2.6,2.205-5.16c0.946-2.562,1.852-4.727,1.931-4.846c0.079-0.078,1.773-0.039,3.781,0.119c3.427,0.275,3.623,0.354,4.176,1.418l0.591,1.143l3.229-0.276c3.151-0.235,3.309-0.196,6.066,1.182c1.575,0.788,3.112,1.456,3.387,1.456c0.316,0,1.773-0.785,3.27-1.771c2.087-1.338,2.835-1.653,3.387-1.338c0.394,0.195,0.708,0.551,0.708,0.748c0,0.236,0.434,0.551,0.946,0.748c0.591,0.236,1.3,1.063,1.772,2.207l0.827,1.852l-0.788,1.101c-0.747,1.064-0.787,1.222-0.235,2.285c0.669,1.26,1.023,1.338,7.089,1.891c3.112,0.236,3.152,0.275,4.727,2.047c3.111,3.466,3.308,3.626,4.767,3.626c1.142,0,1.457,0.156,1.771,0.984c0.59,1.535,0.552,1.575-1.535,2.914c-2.01,1.301-2.403,2.125-2.403,5.002c0,1.182,0.117,1.339,1.693,1.733c3.861,1.063,4.806,1.458,4.924,2.009c0.078,0.354-0.71,1.733-1.694,3.072c-1.537,2.088-1.813,2.68-1.615,3.702c0.393,2.286-0.315,2.677-5.75,3.111c-4.373,0.354-5.043,0.513-7.05,1.694c-1.299,0.746-3.506,1.535-5.239,1.89c-1.615,0.355-4.017,1.183-5.317,1.813c-1.301,0.67-2.521,1.22-2.718,1.22S282.862,324.177,282.547,322.366z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '38',
                    name: 'Иркутская область',
                    path: 'M393.974,359.942c-0.157-0.511-0.709-0.827-1.772-1.023c-1.379-0.237-1.536-0.395-1.418-1.144c0.276-1.298-4.727-4.567-6.932-4.567c-1.141,0-2.916-0.672-6.105-2.245c-4.058-1.97-4.568-2.364-4.805-3.428c-0.512-2.482-2.441-2.521-4.806-0.079c-1.692,1.733-1.733,1.771-2.678,1.143c-0.788-0.513-1.182-0.552-1.97-0.197c-0.905,0.434-1.418,0.236-5.002-1.771c-3.428-1.893-4.333-2.246-6.105-2.285c-2.008,0-2.165-0.119-3.819-1.97c-0.948-1.104-1.733-2.088-1.774-2.246c0-0.116,0.906-0.827,1.97-1.496c1.103-0.71,1.97-1.3,2.011-1.34c0-0.039,0.313-1.93,0.707-4.174c0.631-3.625,0.631-4.334,0.197-5.673c-0.63-1.733-0.827-1.339,2.756-5.555l1.538-1.812l-1.262-3.229c-0.668-1.813-1.221-3.506-1.221-3.781c0-0.237,0.511-1.496,1.181-2.796l1.184-2.324l2.244-0.236c3.545-0.394,3.86-0.513,4.451-1.576c0.314-0.551,0.671-0.983,0.826-0.905c0.158,0.039,1.024,1.063,1.931,2.206c1.42,1.81,1.772,2.047,2.875,1.97c1.262-0.118,1.262-0.16,1.301-2.325c0-2.047,0.197-2.481,3.033-6.813l3.032-4.569l-0.591-1.457c-0.827-1.93-0.788-2.049,0.788-2.324c1.142-0.198,1.731,0,3.819,1.3c2.442,1.537,5.161,2.481,6.146,2.167c0.235-0.078,0.472-0.63,0.472-1.221c0-0.553,0.354-1.812,0.787-2.758c1.065-2.362,1.026-2.64-0.787-3.82c-1.732-1.143-1.812-1.457-0.983-2.914c0.314-0.553,0.59-1.93,0.59-3.034c0-1.969-0.038-2.048-1.3-2.48c-0.749-0.235-1.811-0.945-2.402-1.537c-0.984-1.064-1.063-1.26-0.669-2.678c0.235-0.828,0.434-2.128,0.434-2.836c0-1.023,0.432-1.853,1.731-3.348c1.655-1.97,1.733-2.207,2.442-6.499l0.709-4.451l-1.496-1.26l-1.498-1.223l0.315-4.213l0.276-4.214l2.678-1.813c2.401-1.575,2.717-1.694,3.072-1.102c0.314,0.55,0.118,0.981-0.866,1.968c-1.496,1.575-1.22,1.929,1.852,2.324l2.323,0.354l1.498,2.443c0.826,1.338,1.534,2.953,1.613,3.545c0.079,0.748,0.631,1.417,1.772,2.167c1.499,1.022,1.615,1.219,1.3,2.125c-0.237,0.552-0.395,1.34-0.395,1.735c0,1.101,3.546,6.3,4.294,6.3c1.694,0,1.733,0.237,1.024,8.667l-0.709,7.993l1.536,1.301c2.323,2.008,2.758,2.008,4.647,0.237c1.535-1.457,7.012-5.198,7.641-5.198c0.159,0,0.789,0.589,1.379,1.376c0.591,0.748,1.262,1.381,1.458,1.381c0.197,0,0.984-0.828,1.771-1.854c1.144-1.494,1.379-2.165,1.379-3.702c0-1.458,0.473-2.915,2.127-6.381c2.09-4.45,2.128-4.488,3.624-4.765c3.623-0.591,4.137-0.434,6.656,2.125c1.301,1.3,2.522,2.365,2.758,2.323c0.196,0,1.103-0.353,1.969-0.745c0.866-0.435,1.892-0.789,2.246-0.789c0.669,0,6.656,7.326,6.931,8.468c0.08,0.354-0.668,0.591-2.875,0.788c-3.466,0.316-3.74,0.591-3.74,3.898c0,2.955,1.102,5.2,2.756,5.555c1.379,0.275,2.088,1.576,1.89,3.505c-0.157,1.46-1.652,2.402-4.409,2.798l-1.932,0.275l0.67-0.907c0.867-1.26,0.827-1.416-0.513-2.126c-1.103-0.552-1.181-0.552-3.149,1.023c-1.693,1.418-2.009,1.891-2.245,3.388c-0.157,1.143-0.671,2.245-1.458,3.112c-1.496,1.732-1.969,1.969-4.646,2.323c-2.207,0.275-2.207,0.275-2.641-0.945c-0.511-1.459-0.944-1.536-2.481-0.395c-1.102,0.749-1.26,0.788-2.875,0.236c-1.969-0.71-2.441-0.512-2.836,1.104c-0.354,1.536-0.749,1.732-3.387,1.773c-2.836,0-3.468,0.235-3.468,1.378c0,1.103-0.392,1.495-2.559,2.679c-1.182,0.669-1.615,1.182-1.812,2.204c-0.315,1.616-0.118,2.286,0.786,2.562c0.396,0.118,1.064,0.591,1.498,0.984c0.787,0.748,0.828,0.867,0.237,3.11c-0.592,2.364-0.592,2.402,0.668,6.224c0.708,2.167,1.418,4.058,1.614,4.254c0.474,0.514,0.434,4.136-0.039,7.288c-0.235,1.418-0.512,3.151-0.63,3.819c-0.118,0.866-1.418,2.641-4.292,5.91c-2.52,2.834-4.294,5.236-4.57,6.104c-0.236,0.789-1.653,2.797-3.15,4.451c-1.968,2.205-2.718,3.309-2.718,4.095c0,0.868-0.315,1.262-1.458,1.854c-0.827,0.43-1.614,0.824-1.732,0.865C394.25,360.65,394.053,360.376,393.974,359.942z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '27',
                    name: 'Хабаровский край',
                    path: 'M573.108,324.021c-0.473-1.144-0.591-2.167-0.396-3.545c0.237-1.813,0.16-2.049-1.771-5.041c-1.103-1.734-2.167-3.626-2.404-4.175c-0.196-0.552-0.512-0.985-0.669-0.985c-0.156,0-1.969,0.512-4.017,1.181c-4.373,1.378-4.373,1.378-6.382,0.354l-1.575-0.786l-3.861,2.166c-2.164,1.222-4.016,2.207-4.134,2.207s-0.237-0.277-0.237-0.632c0-0.354-1.142-1.773-2.56-3.15c-2.442-2.404-2.679-2.521-4.49-2.521c-1.733,0-1.93-0.119-2.679-1.496c-0.591-1.064-0.866-2.403-0.983-5.003c-0.158-3.348-0.119-3.702,1.142-6.419c0.71-1.575,1.3-3.311,1.3-3.86c0-0.512,0.551-1.537,1.221-2.284c0.985-1.144,1.104-1.536,0.788-2.167c-0.236-0.434-0.749-0.985-1.143-1.183c-0.906-0.55-0.394-0.982,2.481-2.166c1.3-0.512,2.521-1.182,2.68-1.496c0.353-0.591-3.742-9.769-4.374-9.769c-0.195,0-1.181,0.945-2.204,2.128c-1.537,1.771-2.089,2.165-3.309,2.284c-1.457,0.118-1.457,0.118-1.341,1.734c0.159,1.613,0.119,1.652-2.835,3.857c-1.655,1.222-3.151,2.207-3.347,2.207c-0.198,0-0.75-0.67-1.184-1.458c-0.944-1.575-1.337-1.575-5.237-0.355c-1.734,0.552-1.891,0.513-1.891-0.077c0-1.852,1.299-7.72,2.441-10.83c1.023-2.916,1.183-3.742,0.867-4.926c-0.316-1.261-0.591-1.534-2.01-2.047l-1.693-0.592l-2.954,2.087c-1.614,1.104-3.11,2.05-3.309,2.05c-0.434,0-1.614-3.86-1.614-5.317c0-0.59,0.195-1.379,0.395-1.813c0.786-1.457,0.037-2.678-2.641-4.214l-2.521-1.457l0.276-1.576c0.435-2.6,0.435-2.679-1.142-3.702c-1.261-0.867-1.418-1.065-0.905-1.536c0.433-0.473,0.512-1.654,0.354-6.144L505.046,238l3.899-2.01l3.861-1.971l-0.08-2.363l-0.078-2.402l2.443-0.748l2.441-0.747l0.196-2.954l0.196-2.954l1.379-0.158c2.718-0.235,2.679-0.314-2.088-6.46c-2.521-3.229-3.033-4.135-3.386-6.066c-0.554-2.914-0.591-2.638,0.786-4.252c1.379-1.538,1.34-1.97-0.434-4.924c-0.59-1.025-1.299-2.482-1.613-3.309c-0.474-1.262-0.435-1.498,0.156-2.127c0.551-0.513,1.261-0.669,3.151-0.551c1.339,0.039,3.23-0.158,4.214-0.433c1.498-0.473,1.931-0.828,2.759-2.403l0.983-1.812h2.285h2.323l-0.275-2.088l-0.235-2.048l1.929-1.497c1.931-1.458,2.009-1.497,3.821-1.064c2.837,0.63,4.766,1.812,6.065,3.663l1.182,1.733l-1.143,1.576l-1.143,1.536l0.984,1.457c1.104,1.615,1.891,1.773,3.309,0.67c0.866-0.67,1.616-0.788,5.83-0.788c3.899,0,4.806,0.079,4.806,0.551c0,0.315-0.867,0.828-2.05,1.222c-2.716,0.905-3.11,1.26-2.992,2.678c0.118,1.103-0.04,1.26-1.575,1.811c-0.945,0.355-1.93,0.985-2.167,1.419c-0.235,0.432-2.048,2.716-4.018,5.12c-1.968,2.363-3.78,4.607-4.096,5.001c-0.433,0.592-0.394,1.025,0.394,2.875c0.985,2.364,0.945,2.875-0.63,6.933l-0.709,1.813l1.457,2.363l1.497,2.402l-1.222,4.884l-1.22,4.924l0.629,5.514l0.63,5.554l-1.811,8.509c-1.024,4.687-1.733,8.705-1.614,8.9c0.157,0.197,1.024,0.395,1.93,0.395c1.379,0,2.244-0.354,4.293-1.771c1.457-0.985,2.798-1.773,2.993-1.773c0.236,0,1.143,0.867,2.088,1.969c1.969,2.284,3.19,2.601,3.15,0.788c0-0.118-0.118-0.59-0.235-1.063c-0.198-0.668-0.042-0.985,0.591-1.339c1.063-0.552,1.613-0.039,2.284,2.284c0.314,1.182,0.669,1.695,1.181,1.695c0.788,0,4.371-3.626,4.371-4.374c0-0.276-0.551-1.457-1.26-2.638l-1.221-2.167l1.654-1.575c1.575-1.457,1.774-1.537,3.506-1.301c1.024,0.118,3.506,0.354,5.515,0.473c3.898,0.236,3.702,0.118,4.097,2.678c0.078,0.475,1.339,1.42,3.465,2.602l3.349,1.851l0.669,3.11c1.025,4.926,3.348,9.493,7.051,13.787c1.772,2.047,4.451,5.79,5.947,8.349l2.797,4.57l0.274,5.515c0.159,3.071,0.119,5.71-0.039,5.907c-0.434,0.473-1.534-0.474-1.534-1.379c0-0.669-3.979-3.898-4.768-3.898c-0.629,0-4.292,5.316-4.175,6.065c0.04,0.473,0.748,1.18,1.616,1.654c1.22,0.669,1.771,0.787,2.756,0.511c0.671-0.196,1.262-0.352,1.339-0.352c0.039,0,0.079,1.062,0.079,2.362v2.363h-1.221c-0.631,0-1.536,0.157-1.968,0.394c-0.75,0.434-0.75,0.512,0.472,2.639l1.259,2.206l-1.614,1.496c-1.615,1.496-1.654,1.536-4.766,1.536h-3.151l-1.418,2.167c-1.457,2.323-1.614,2.913-0.944,3.622c0.472,0.434,0.195,1.3-0.395,1.3C573.896,325.635,573.463,324.888,573.108,324.021z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '78',
                    name: 'Санкт-Петербург',
                    path: 'M75.329,183.131c-0.275-0.433-0.708-3.229-0.551-3.229c0.118,0,0.827,0.275,1.654,0.59c1.851,0.788,2.718,0.512,2.481-0.788c-0.118-0.551-0.039-0.985,0.158-0.985c0.275,0,1.733,0.788,2.638,1.457c0.079,0.04-0.157,0.827-0.551,1.694l-0.709,1.576h-2.482C76.629,183.448,75.408,183.29,75.329,183.131z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '41',
                    name: 'Камчатский край',
                    path: 'M598.608,177.853c-1.407-5.451,0.067,0.041-0.722-3.464c-0.828-3.545-0.674-3.821-2.406-5.357l-1.813-1.615l0.67-2.836c0.828-3.387,1.143-2.166-4.214-17.369l-3.979-11.226l-0.276-5.042c-0.353-5.868-0.513-6.262-4.214-8.901c-1.418-0.984-2.993-2.166-3.545-2.599l-0.905-0.788l0.983-1.891c1.419-2.638,1.103-3.427-1.378-3.427h-1.931l-1.812,3.349c-1.3,2.402-1.773,3.624-1.613,4.253c0.156,0.473,1.418,1.812,2.796,2.954c1.575,1.261,2.56,2.403,2.56,2.836c0,0.433-0.117,0.788-0.276,0.788c-0.157,0-1.536-1.221-3.071-2.718c-2.993-2.915-4.569-3.742-6.026-3.072c-1.103,0.473-1.299,0.276-2.442-2.6c-0.789-2.088-0.984-2.245-2.126-2.245c-1.655-0.04-1.891-0.237-3.389-2.875c-1.103-2.009-1.417-2.285-2.796-2.521c-1.339-0.197-1.536-0.354-1.536-1.3c0-1.3,1.261-3.033,4.451-6.066c1.34-1.299,2.993-3.269,3.623-4.333c0.983-1.654,1.379-2.009,2.482-2.127c0.983-0.079,1.496-0.394,1.969-1.26c0.551-0.945,1.142-1.221,3.309-1.733c3.938-0.906,3.898-0.906,5.593,2.167c0.826,1.537,1.732,2.875,2.049,2.993c0.315,0.118,1.417-0.512,2.44-1.378c1.813-1.497,2.088-1.615,4.806-1.693l2.876-0.119l0.709-2.561c0.395-1.417,0.748-3.111,0.748-3.78c0-0.669,0.434-2.324,0.984-3.703c0.553-1.379,0.986-3.112,0.986-3.821v-1.3h2.283c1.222,0,2.442,0.119,2.678,0.276c0.237,0.158,1.617,4.451,3.073,9.571c1.732,6.145,2.994,9.886,3.781,11.146c0.669,1.025,1.181,2.049,1.181,2.206c0,0.158-1.575,0.789-3.504,1.339c-1.931,0.552-3.664,1.261-3.862,1.497c-0.235,0.275-0.59,2.481-0.825,4.923c-0.354,3.703-0.354,4.608,0.118,5.79c0.905,2.166,0.748,2.325-1.222,1.261c-3.466-1.93-3.859-1.261-1.93,3.269c0.748,1.772,1.379,3.427,1.379,3.624s-0.709,1.261-1.575,2.363c-0.867,1.103-1.575,2.127-1.575,2.284c0,0.906,9.61,15.637,10.516,16.11c0.395,0.197,1.614,0.236,2.677,0.118l0.657-1.221l0.274-1.722c0.881-0.99,1.424-0.672,2.054-0.869c0.827-0.236,1.349,0.7,1.979,1.843c0.237,0.472,1.415,1.068,2.086,2.156c2.542,1.724,5.771,1.043,8.145,2.214c-0.911,3.56-0.62,7.542-0.915,5.806c-0.588-3.451,1.013,1.92,2.432,4.48l6.31,2.042l0.392,2.576c-3.033,2.6-1.889,9.949-2.15,9.51c-1.472-2.468-0.106,0.051,6.102,4.042c1.575,1.063-0.464,7.998,1.499,10.59c3.285,3.155,3.579,3.545,5.104,6.557l1.969,8.473l-34.556-16.938c-1.98-1.841-3.944-4.439-4.063-4.4C602.563,182.43,599.829,179.191,598.608,177.853z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '49',
                    name: 'Магаданская область',
                    path: 'M540.495,191.916c-0.354-0.828-0.275-1.182,0.67-2.404l1.063-1.418l-1.417-2.127c-1.497-2.244-3.782-3.741-6.539-4.292c-0.749-0.158-1.653-0.354-2.01-0.434c-0.354-0.117-1.456,0.434-2.441,1.222c-1.024,0.788-2.048,1.299-2.246,1.183c-0.196-0.159-0.393-0.868-0.393-1.656c0-1.181-0.395-1.811-2.718-4.213c-3.467-3.584-4.766-6.105-4.766-9.256v-2.324l2.6-1.339c1.457-0.709,2.717-1.536,2.835-1.812c0.079-0.315-0.55-1.299-1.457-2.245l-1.654-1.654l2.284-2.048c1.654-1.458,2.521-1.969,3.072-1.812c0.434,0.118,1.261,0.315,1.851,0.433l1.064,0.236l-0.236-2.008c-0.197-1.891-0.156-2.088,1.339-3.859c0.866-1.064,1.693-2.128,1.852-2.403c0.157-0.276-0.67-1.457-2.128-3.073l-2.441-2.6l0.276-1.889c0.236-1.853,0.236-1.891-1.182-2.758c-1.142-0.709-1.379-1.063-1.182-1.733c0.709-2.284,0.669-2.481-0.551-3.387c-0.671-0.473-1.223-0.985-1.223-1.182c0-0.158,1.184-1.063,2.6-2.009c1.418-0.945,2.76-2.088,2.955-2.6c0.236-0.669,0.63-0.906,1.496-0.906c1.418,0,1.418,0,2.127-3.112c0.552-2.285,0.514-2.482-0.196-3.388c-0.71-0.945-0.71-0.945,0.039-1.378c0.552-0.276,0.866-0.237,1.3,0.275c0.275,0.355,1.181,1.104,2.009,1.695l1.456,1.102l3.586-1.338c2.204-0.828,4.175-1.852,5.082-2.679c1.141-1.024,1.93-1.378,3.622-1.615c1.378-0.158,2.679-0.63,3.506-1.221c2.086-1.536,2.914-1.3,4.607,1.418c1.261,2.048,1.615,2.363,2.679,2.363c1.458,0,1.733,0.315,2.679,2.796c0.354,0.984,0.865,2.088,1.142,2.481c0.513,0.669,0.59,0.669,1.813,0.04c1.181-0.63,1.339-0.591,2.521,0.158c0.708,0.433,2.323,1.851,3.623,3.151s2.559,2.402,2.796,2.402c0.354,0,2.52,9.334,2.52,10.792c0,0.354-1.85,0.237-3.032-0.197c-0.591-0.236-1.85-1.3-2.796-2.362c-0.945-1.064-2.047-1.93-2.48-1.93c-0.514,0-1.694,1.417-3.822,4.608c-1.693,2.56-3.188,4.923-3.309,5.278c-0.275,0.669,0.159,2.284,3.428,12.919c2.127,6.893,3.388,9.611,5.121,11.028c0.55,0.473,0.787,0.434,1.771-0.314c1.261-0.907,1.971-1.064,1.971-0.434c0,0.236-0.867,1.418-1.891,2.678c-1.655,2.009-2.009,2.797-2.994,6.579c-1.341,5.081-1.614,5.711-2.521,5.711c-1.378-0.04-1.615-0.512-1.143-2.285c0.514-1.85,0.158-2.441-1.496-2.441c-1.023,0-9.649,5.041-9.926,5.829c-0.156,0.315,0.078,1.496,0.473,2.639c0.395,1.142,0.59,2.245,0.434,2.481c-0.118,0.236-0.867,0.591-1.614,0.867c-0.749,0.236-1.379,0.591-1.379,0.788c0,0.236-2.128,0.395-4.806,0.395c-4.175,0-5.002,0.118-6.026,0.787C541.243,193.097,541.046,193.097,540.495,191.916z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '28',
                    name: 'Амурская область',
                    path: 'M521.944,320.83c-2.206-2.009-6.145-5.593-8.743-7.996c-8.901-8.19-8.588-7.995-11.228-8.27c-1.929-0.237-2.56-0.158-3.425,0.395c-0.866,0.591-1.576,0.629-4.688,0.392c-3.979-0.275-4.885,0-8.745,2.641c-2.047,1.418-2.757,1.3-5.199-0.867l-1.772-1.536l0.71-1.182c0.944-1.575,0.864-2.127-0.435-3.112c-0.826-0.591-1.3-1.496-1.811-3.308c-1.262-4.57-1.457-5.042-2.167-5.042c-0.393,0-1.104,0.433-1.614,0.985c-0.513,0.511-1.025,0.984-1.181,0.984c-0.119,0-0.789-0.828-1.498-1.773c-0.67-0.985-1.458-1.771-1.733-1.771c-0.236,0-0.945,0.473-1.575,1.023c-1.38,1.339-2.324,0.789-2.009-1.182c0.197-1.181,0.079-1.338-1.813-2.361c-1.102-0.593-2.009-1.302-2.009-1.538c0-0.275,0.907-1.104,2.009-1.851c1.892-1.262,2.088-1.301,3.625-0.946c2.559,0.671,7.602,0.316,10.555-0.709l2.641-0.864l1.93,1.258c2.361,1.499,2.914,1.538,5.868,0.237c1.812-0.828,2.718-0.985,4.135-0.828c1.733,0.197,2.05,0.081,5.121-1.969c2.009-1.34,4.411-2.559,6.027-3.032c1.731-0.553,2.874-1.143,3.149-1.615c1.537-2.837,2.363-3.742,3.663-3.979c0.827-0.155,2.679-1.338,4.688-2.913c4.371-3.467,5.042-3.781,6.38-3.309c1.537,0.512,1.616,2.442,0.158,6.105c-1.064,2.719-2.442,9.137-2.442,11.501c0,1.261,0.236,1.261,3.467,0.276c1.378-0.435,2.719-0.789,2.993-0.789c0.276,0,0.906,0.709,1.379,1.576c0.472,0.866,1.063,1.575,1.3,1.575c0.235,0,2.086-1.26,4.136-2.757c3.387-2.6,3.662-2.875,3.662-4.136c0-1.22,0.118-1.379,0.945-1.379c0.67,0,1.536-0.63,2.757-2.048l1.773-2.01l1.221,2.718c0.71,1.499,1.497,3.27,1.813,3.938l0.512,1.26l-3.113,1.262c-1.733,0.67-3.151,1.457-3.151,1.693s0.552,0.986,1.223,1.694l1.22,1.261l-0.984,0.866c-0.63,0.551-1.103,1.497-1.26,2.482c-0.158,0.905-0.827,2.718-1.457,4.056c-1.104,2.324-1.182,2.677-1.026,6.694c0.119,3.9,0.237,4.452,1.223,5.95c1.024,1.614,1.142,1.693,3.151,1.693c1.969,0,2.165,0.078,4.136,2.086c1.143,1.144,2.048,2.325,2.048,2.601c0,0.313-0.354,1.931-0.827,3.622c-0.63,2.326-1.024,3.153-1.615,3.309c-0.433,0.158-2.441,0.04-4.412-0.235c-3.386-0.433-3.703-0.433-5.552,0.354c-1.813,0.789-7.091,2.443-7.8,2.443C526.119,324.454,524.189,322.8,521.944,320.83z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '06',
                    name: 'Республика Ингушетия',
                    path: 'M33.067,351.04c-0.158-0.392,0.079-1.023,0.63-1.574c0.788-0.828,0.866-1.222,0.63-3.151l-0.275-2.167h2.915c3.545,0,5.278,0.314,5.554,0.986c0.158,0.432-1.457,1.575-8.31,6.024C33.422,351.631,33.303,351.631,33.067,351.04z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '30',
                    name: 'Астраханская область',
                    path: 'M66.191,338.791c-2.6-0.276-5.042-0.434-5.396-0.315c-0.394,0.119-0.945,0.039-1.3-0.157c-0.472-0.274-0.276-0.63,1.143-2.048l1.772-1.695l-0.788-1.534c-0.867-1.734-0.984-1.614,2.481-2.284c1.261-0.277,2.363-0.591,2.442-0.748c0.079-0.119,0-1.144-0.197-2.205c-0.354-1.813-0.275-2.012,1.024-3.939c0.748-1.104,1.379-2.127,1.379-2.285c0-0.159-0.907-0.276-2.009-0.276h-2.047l0.275-3.148c0.158-2.012,0.079-3.743-0.236-4.887c-0.236-0.985-0.354-1.929-0.197-2.087c0.197-0.157,1.694-0.275,3.348-0.237c2.6,0.039,3.112,0.199,3.702,0.908c0.867,1.062,0.906,1.811,0.119,2.6c-0.631,0.628-0.709,1.849-0.236,3.11c0.197,0.473,0.039,1.574-0.395,2.875c-0.866,2.521-0.708,2.915,1.772,4.765c0.985,0.75,1.891,1.617,1.97,1.97c0.118,0.355,0.315,2.206,0.433,4.177l0.276,3.583l-1.654,0.67c-1.654,0.631-1.693,0.631-1.417,2.206C72.729,339.658,73.321,339.578,66.191,338.791z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '16',
                    name: 'Республика Татарстан',
                    path: 'M130.196,290.146c-0.906-1.297-1.772-2.244-1.97-2.125c-0.315,0.196-1.181-2.128-1.181-3.23c0-0.512-2.482-2.48-3.151-2.48c-0.276,0-0.945,0.352-1.497,0.785l-1.063,0.828l-0.866-1.102c-0.513-0.631-0.907-1.3-0.907-1.537c0-0.236-0.433-0.827-0.906-1.299c-0.512-0.473-1.142-1.576-1.417-2.443c-0.394-1.377-0.591-1.535-1.733-1.535c-1.457-0.04-1.851-0.237-2.757-1.654c-0.552-0.906-0.985-1.104-2.718-1.183c-1.457-0.077-2.127-0.313-2.206-0.707c-0.079-0.434,0.236-0.632,0.985-0.632c0.63,0,1.97-0.039,2.993-0.078l1.93-0.079l-0.157-1.653l-0.119-1.655l2.166-0.71c1.182-0.394,3.782-1.22,5.791-1.85l3.583-1.144l1.418,0.946c0.945,0.671,1.693,0.867,2.363,0.709c1.023-0.237,1.103-0.078,2.048,5.119c0.314,1.733,1.575,4.807,2.087,5.12c0.196,0.12,1.891-0.313,3.781-0.942c1.891-0.671,3.624-1.065,3.781-0.986c0.709,0.434,0.315,1.773-0.828,3.072c-1.457,1.656-1.457,2.088-0.196,2.402c1.259,0.314,2.284,2.207,1.378,2.52c-0.315,0.121-1.654,0.591-2.954,1.024l-2.364,0.828l-0.197,1.813c-0.158,1.18-0.709,2.598-1.695,4.056c-0.787,1.182-1.536,2.206-1.653,2.206C131.89,292.551,131.063,291.487,130.196,290.146z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '47',
                    name: 'Ленинградская область',
                    path: 'M86.555,201.487c-0.276-0.276-0.473-0.631-0.473-0.789c0-0.197-0.748-1.931-1.654-3.859l-1.614-3.545h-1.537c-1.378,0-1.536-0.118-1.299-0.788c0.157-0.512-0.079-1.339-0.591-2.166c-0.866-1.418-1.497-1.616-3.544-1.024c-1.537,0.432-4.254-0.238-5.357-1.339c-0.945-0.946-1.024-0.985-2.127-0.395c-0.63,0.315-1.221,0.591-1.339,0.591c-0.079,0-0.276-1.025-0.394-2.285c-0.158-1.221-0.63-3.466-1.103-4.924c-1.024-3.072-0.945-3.19,1.89-3.623c1.261-0.197,2.167-0.04,3.663,0.591c2.088,0.905,2.442,1.457,3.034,4.805c0.236,1.378,0.314,1.457,2.284,1.694c1.104,0.118,2.64,0.197,3.388,0.118c1.222-0.118,1.458-0.354,2.403-2.284c0.59-1.222,0.985-2.324,0.867-2.481c-0.079-0.157-1.261-0.907-2.679-1.654c-1.851-1.063-2.6-1.733-2.915-2.639c-0.63-1.851-0.552-2.206,0.906-3.703c1.182-1.26,1.536-1.378,3.072-1.26c1.655,0.119,1.733,0.197,2.836,2.363c0.63,1.26,2.206,4.687,3.544,7.681l2.403,5.436l2.284,0.315c2.127,0.315,2.363,0.276,3.309-0.591l0.985-0.905l0.945,1.181c0.512,0.63,1.497,1.891,2.127,2.796l1.181,1.654l-1.417,0.473c-0.788,0.276-2.718,1.615-4.294,2.994c-2.284,2.008-2.915,2.796-3.032,3.781c-0.079,1.024-0.512,1.457-2.482,2.718C87.106,202.118,87.186,202.077,86.555,201.487z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '07',
                    name: 'Кабардино-Балкарская Республика',
                    path: 'M24.48,340.877c-0.394-1.337-1.024-2.833-1.498-3.308l-0.787-0.865l1.97-0.984l1.969-1.025l2.127,1.183c1.143,0.63,3.269,1.772,4.726,2.559l2.639,1.38l-0.789,1.338c-0.787,1.301-0.787,1.341-3.071,1.104c-1.576-0.118-2.915,0-4.215,0.434c-1.024,0.355-1.97,0.67-2.127,0.67C25.268,343.36,24.874,342.257,24.48,340.877z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '74',
                    name: 'Челябинская область',
                    path: 'M156.743,325.438c-0.118-0.314-0.039-1.142,0.197-1.851c0.552-1.577,0.118-2.168-2.048-2.521c-2.993-0.475-3.151-0.709-2.126-2.835c0.512-1.025,1.338-2.957,1.852-4.334c1.141-3.15,3.82-5.829,5.435-5.437c2.679,0.671,2.954,0.552,4.293-1.93c2.087-3.859,1.615-5.276-1.497-4.568c-1.339,0.277-2.481,0.195-5.041-0.354c-1.812-0.393-3.387-0.866-3.545-1.063c-0.158-0.197-0.63-1.102-1.025-2.048l-0.748-1.694l0.985-0.748c1.693-1.339,2.56-1.339,4.174-0.079c1.26,1.024,1.969,1.222,4.688,1.458c3.702,0.354,3.624,0.394,4.884-3.428c0.472-1.456,0.985-2.638,1.102-2.638c0.828,0,9.099,3.622,10.083,4.41c0.946,0.749,1.182,1.262,1.339,3.112c0.157,2.206,0.157,2.206-1.812,4.411c-2.008,2.204-3.624,4.845-3.624,5.907c0,0.355,0.946,0.828,2.561,1.262c1.418,0.395,2.56,0.789,2.56,0.867c0,0.117-0.394,0.866-0.828,1.693c-1.023,1.811-1.417,1.811-6.578-0.08c-3.663-1.338-4.569-1.22-5.79,0.592c-0.591,0.945-0.591,1.181,0.354,4.058c1.024,3.268,0.828,3.857-0.906,2.914c-1.143-0.631-4.215-0.513-4.924,0.197c-0.314,0.316-0.709,1.379-0.866,2.363c-0.119,0.985-0.512,2.048-0.828,2.362C158.319,326.187,157.02,326.187,156.743,325.438z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '59',
                    name: 'Пермский край',
                    path: 'M157.176,285.146c-0.236-0.158-1.023-1.262-1.732-2.441c-0.709-1.223-1.34-2.208-1.379-2.287c-0.079-0.039-1.064-0.274-2.245-0.47c-1.654-0.317-2.363-0.711-3.23-1.695c-0.985-1.144-2.403-3.821-2.167-4.058c0.08-0.04,0.789-0.353,1.616-0.709c0.788-0.315,1.457-0.827,1.457-1.141c0-0.276,0.709-2.01,1.575-3.783c0.985-2.047,1.576-3.82,1.576-4.766c0-2.363,0.433-3.858,1.379-4.844c0.473-0.474,1.142-1.419,1.457-2.048c0.551-1.024,0.551-1.34,0.039-2.758c-0.512-1.536-0.512-1.614,0.355-2.324c1.497-1.181,4.136-3.703,4.451-4.174c0.118-0.238-0.749-1.458-1.97-2.718c-2.166-2.324-2.206-2.363-2.088-4.451c0.119-2.01,0.197-2.087,1.261-2.245c0.631-0.039,1.733,0,2.481,0.116c1.103,0.238,1.496,0.592,2.205,2.129c0.867,1.771,0.946,1.851,4.136,2.797l3.23,0.944l3.938-0.708c4.372-0.828,4.923-0.749,10.359,1.221c1.655,0.59,3.033,1.339,3.033,1.615c0,0.275-0.354,1.181-0.788,1.97c-0.433,0.825-0.787,1.93-0.787,2.52c0,1.813-5.711,8.231-8.075,9.021l-1.458,0.472l0.197,1.852c0.118,1.024,0.512,2.48,0.906,3.27c0.629,1.339,0.629,1.496,0.039,2.441c-0.354,0.552-0.669,1.496-0.669,2.166c0,1.064-0.197,1.221-2.245,1.971c-2.521,0.943-3.269,1.653-3.269,3.11c0,0.947-0.039,0.947-2.364,0.71l-2.324-0.277l-0.985,1.97l-1.024,1.971l-2.245,0.117l-2.285,0.118l-0.591,2.719C158.358,285.146,157.965,285.737,157.176,285.146z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '15',
                    name: 'Республика Северная Осетия - Алания',
                    path: 'M29.364,348.521c-2.6-0.671-2.994-1.064-3.702-3.428c-0.197-0.747,0-0.907,1.812-1.337c1.143-0.238,2.875-0.396,3.86-0.356l1.772,0.158l0.119,2.284c0.118,2.089-0.316,3.505-1.064,3.386C32.042,349.189,30.782,348.874,29.364,348.521z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '60',
                    name: 'Псковская область',
                    path: 'M51.106,207.552c-1.733-3.387-4.766-11.5-4.53-12.17c0.355-1.023,5.238-9.256,5.948-10.083c0.315-0.355,1.142-0.67,1.813-0.67c1.653,0,2.638-0.748,4.135-3.112c1.222-1.89,2.679-2.796,4.373-2.796c0.945,0,2.285,3.584,2.6,6.971l0.276,2.875h-0.985c-1.457,0-2.009,0.906-1.771,2.835c0.118,0.946,0.314,2.048,0.472,2.482c0.158,0.551-0.276,1.299-1.575,2.757c-4.806,5.2-5.238,5.829-5.672,8.232c-0.236,1.299-0.433,2.402-0.433,2.48c0,0.316-2.6,1.695-3.19,1.695C52.209,209.05,51.54,208.38,51.106,207.552z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '83',
                    name: 'Ненецкий автономный округ',
                    path: 'M208.302,200.423c-7.208-3.19-9.768-4.529-14.849-7.917c-4.648-3.033-6.381-3.979-7.051-3.821c-0.787,0.197-11.934,0.236-18.118,0.079c-1.457-0.04-2.796-0.237-2.993-0.434c-0.197-0.197-1.458-2.481-2.796-5.041c-2.009-3.742-2.363-4.727-1.931-5.042c0.316-0.197,1.143-0.708,1.89-1.181l1.301-0.827l-0.237-2.718l-0.275-2.678l1.693-0.749c2.324-0.985,5.83-4.845,5.83-6.381c0-0.59,0.157-1.221,0.354-1.338c0.63-0.395,2.481,1.457,3.23,3.229c0.945,2.245,0.945,3.742,0,4.608c-0.749,0.67-0.867,0.67-2.796,0c-1.93-0.708-1.969-0.708-3.742,0.157c-0.984,0.474-1.891,1.143-2.047,1.498c-0.237,0.668,0.55,6.813,0.984,7.522c0.315,0.473,4.293,2.087,5.2,2.087c0.354,0,1.575-0.984,2.757-2.166l2.126-2.167h11.148c6.184,0,11.186,0.157,11.304,0.354c0.157,0.197-0.748,0.907-1.93,1.575c-1.221,0.67-2.284,1.497-2.441,1.852c-0.236,0.629,2.323,3.544,3.624,4.056c0.512,0.197,1.575,0.041,2.915-0.433c2.678-0.905,3.465-0.905,5.948,0.079c1.614,0.63,2.481,0.708,4.963,0.511l2.992-0.236l-0.275,1.812c-0.275,1.733-0.237,1.851,0.827,2.284c1.891,0.789,3.82,0.552,5.672-0.67l1.694-1.141l-0.237-2.64c-0.197-2.087-0.079-2.796,0.395-3.269c0.63-0.67,0.551-0.67,6.695,2.835c0.945,0.552,2.166,1.733,2.915,2.915l1.261,1.969l-0.828,1.143c-1.063,1.418-1.063,1.26,0.197,4.215c0.551,1.378,0.906,2.599,0.749,2.757c-0.158,0.157-0.827,0.039-1.536-0.236c-1.221-0.473-1.3-0.433-2.718,1.143c-1.023,1.141-1.969,1.732-3.111,2.007c-0.906,0.197-2.363,0.985-3.269,1.695c-0.984,0.826-2.521,1.574-4.018,1.968c-1.338,0.354-2.481,0.592-2.561,0.592C217.124,204.283,213.107,202.51,208.302,200.423z m -16.37, -37.05 -3.16744,0 -2.53394,2.33201 0.63349,2.33201 3.16744,0.58303 0.63348,0 0.63348,-0.58303 0.63349,0 0,0 0.63348,-0.583 0,0.583 0,0 -0.63348,0.58303 0,0 0.63348,0 0.63348,-0.58303 0,-2.33201 z m 29.14029,13.40911 1.26697,0.58301 0,0.583 0,0.583 0,0.58301 1.90046,1.166 1.26697,-1.74901 -0.63349,-1.74901 -0.63348,-1.74903 0,0 0,-1.16599 -0.63349,-1.16602 -1.26697,0 0,1.16602 -0.63348,0 -0.63349,0 z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '57',
                    name: 'Орловская область',
                    path: 'M50.791,255.447c-0.197-0.276-0.552-1.576-0.827-2.836c-0.394-1.932-0.828-2.64-2.875-4.843c-1.378-1.499-2.284-2.72-2.087-2.996c1.024-1.851,2.6-3.387,3.15-3.149c0.354,0.118,0.827-0.041,1.143-0.473c0.473-0.631,0.749-0.631,3.27-0.157l2.756,0.51l0.236,1.932c0.197,1.3,0.67,2.323,1.418,3.19c1.733,1.968,1.615,4.176-0.354,6.933c-1.417,2.087-1.536,2.165-3.506,2.284C51.776,255.921,50.988,255.762,50.791,255.447z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '48',
                    name: 'Липецкая область',
                    path: 'M61.977,266.908c-0.985-0.511-1.575-1.18-1.89-2.125c-0.237-0.749-0.671-1.536-0.906-1.694c-0.276-0.157-0.789-0.749-1.143-1.34c-0.395-0.591-1.222-1.144-1.891-1.3c-0.67-0.157-1.693-0.904-2.363-1.732l-1.182-1.418l1.379-0.119c1.181-0.119,1.654-0.471,3.032-2.363c0.867-1.259,1.733-2.402,1.931-2.599c0.157-0.198,0.748,0.157,1.26,0.749l0.945,1.103l1.733-0.709c0.946-0.354,1.93-0.749,2.166-0.866c0.395-0.158,4.491,4.764,4.491,5.355c0,0.119-0.985,0.945-2.167,1.813l-2.166,1.575l0.079,2.913c0.118,2.838,0.079,2.954-0.906,3.191C63.75,267.539,62.883,267.381,61.977,266.908z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '43',
                    name: 'Кировская область',
                    path: 'M131.614,270.021c-0.117-0.275-0.669-3.269-1.26-6.577c-0.63-3.349-1.339-6.303-1.576-6.539c-0.512-0.512-6.696-2.011-7.602-1.813c-0.314,0.04-1.064,0.473-1.654,0.906c-0.63,0.472-1.181,0.749-1.26,0.67c-0.079-0.079-0.276-0.985-0.394-1.971c-0.197-1.613-0.118-1.89,1.182-3.23c0.827-0.904,1.615-1.416,2.047-1.3c0.355,0.081,1.064,0.278,1.537,0.434c0.669,0.199,1.378-0.038,2.48-0.825c0.828-0.591,1.537-1.223,1.537-1.38c0-0.197-0.946-1.104-2.127-2.008c-1.182-0.945-2.166-1.891-2.166-2.167c-0.04-0.234,0.826-0.984,1.852-1.653c1.693-1.104,2.245-1.222,4.726-1.222h2.836v-2.521c0-2.127,0.157-2.601,0.984-3.389c0.551-0.512,0.985-1.18,0.985-1.456c0-0.314,0.394-1.3,0.827-2.208c0.669-1.258,0.749-1.771,0.394-2.322c-0.394-0.63-0.118-0.866,2.324-2.087c1.497-0.749,2.915-1.38,3.112-1.38c0.197,0,0.67,0.474,1.024,1.064c0.669,0.984,0.669,1.182,0.04,3.624c-0.512,1.89-1.064,2.994-2.127,4.057l-1.418,1.496l0.434,2.049c0.787,3.819,1.732,6.617,2.245,6.617c0.276,0,1.418-0.827,2.561-1.771c1.143-0.985,2.087-1.773,2.127-1.773c0.039,0,1.417,0.353,3.033,0.788c1.615,0.434,3.859,0.787,4.923,0.787c1.892,0.039,2.048,0.119,3.939,2.245l1.97,2.204l-2.757,2.523l-2.718,2.52l0.63,1.733c0.63,1.694,0.63,1.694-0.551,3.309c-0.631,0.866-1.261,1.614-1.34,1.614c-0.119,0-1.023-0.434-2.087-0.983c-3.427-1.732-6.026-2.601-6.578-2.127c-0.276,0.196-1.221,1.613-2.088,3.11c-1.614,2.679-1.653,2.718-3.465,2.836l-1.89,0.119l-0.512,2.441c-0.433,1.931-0.709,2.481-1.261,2.481c-0.866,0-1.418,0.632-1.772,2.05C132.441,270.256,131.85,270.769,131.614,270.021z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '75',
                    name: 'Забайкальский край',
                    path: 'M420.482,368.45c-1.38-1.103-1.576-1.458-1.498-2.639c0.079-1.104,0.395-1.576,1.734-2.561c0.904-0.668,1.653-1.418,1.653-1.733c0.039-0.275-0.669-0.789-1.536-1.181c-1.812-0.749-1.891-1.104-0.748-2.601c0.748-0.945,0.828-1.221,0.433-2.521c-0.393-1.221-0.354-1.496,0.238-1.93c0.393-0.314,1.14-0.433,1.811-0.314c0.867,0.156,1.458-0.04,2.678-0.985c1.064-0.867,2.127-1.3,3.585-1.497c1.812-0.236,2.126-0.393,2.638-1.535c0.354-0.71,1.42-2.05,2.444-3.033c1.219-1.183,1.89-2.165,2.047-3.15c0.237-1.262,0.513-1.537,2.718-2.521c2.009-0.946,2.836-1.654,4.727-4.018c2.127-2.678,2.285-3.033,2.166-4.688c-0.118-1.573-0.275-1.85-1.38-2.362c-1.81-0.748-2.48-2.875-1.376-4.096c0.434-0.474,1.456-1.892,2.322-3.192c2.442-3.858,4.964-6.813,6.026-7.088c1.575-0.435,1.972-0.985,1.972-2.837c0-1.338-0.237-1.93-0.947-2.639c-1.143-1.022-4.215-2.6-5.122-2.6c-0.981,0-5.946-8.154-6.222-10.239c-0.118-0.867,0.078-0.986,2.481-1.418c4.647-0.867,6.104-2.09,5.673-4.808c-0.514-3.15-0.553-3.188-1.971-3.466c-1.811-0.354-2.561-1.732-2.561-4.843c0-2.757,0.079-2.797,3.86-2.797h2.639l0.788,2.008c0.671,1.733,1.299,2.48,3.94,4.531c1.73,1.378,4.175,3.032,5.396,3.738c2.126,1.145,2.245,1.302,2.166,2.602c-0.078,1.182,0.118,1.457,1.379,2.206l1.457,0.828l0.944-0.867c0.513-0.474,1.025-0.867,1.183-0.867c0.118,0,0.787,0.788,1.496,1.773c0.709,0.944,1.497,1.771,1.732,1.771c0.276,0,0.947-0.392,1.537-0.826c0.591-0.473,1.143-0.788,1.221-0.708c0.038,0.078,0.474,1.417,0.946,2.953c0.472,1.614,1.258,3.23,1.811,3.781l0.985,0.986l-0.828,1.023c-0.434,0.591-0.749,1.299-0.668,1.573c0.078,0.316,1.26,1.459,2.638,2.602l2.48,2.087l-2.204,2.204c-1.615,1.655-2.442,2.917-3.151,4.887c-1.142,2.953-1.063,3.663,0.472,4.015c0.592,0.158,1.852,1.144,2.798,2.208l1.733,1.968l-1.063,2.364c-1.025,2.285-1.064,2.562-0.945,8.232c0.118,5.553,0.157,5.907,1.063,6.892c1.103,1.143,0.789,1.772-1.182,2.601c-0.866,0.355-1.457,1.063-2.127,2.599c-0.592,1.341-1.26,2.245-1.852,2.441c-2.01,0.789-4.45,0.867-6.42,0.276c-2.993-0.904-3.504-0.787-4.727,0.985c-1.219,1.771-1.418,1.811-4.411,0.946c-2.6-0.75-5.789-0.591-6.733,0.392c-0.356,0.356-1.538,2.168-2.641,4.057c-1.891,3.27-2.206,3.585-6.931,7.052l-4.925,3.663l-6.578,0.789C422.845,370.024,422.45,370.024,420.482,368.45L420.482,368.45z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '50',
                    name: 'Московская область',
                    path: 'M70.563,245.797c-0.079-0.118,0.079-0.748,0.354-1.418c0.473-1.142,0.395-1.457-0.866-4.214c-1.143-2.52-1.339-3.229-1.103-4.807c0.276-2.165-0.709-4.646-1.812-4.646c-0.354,0-1.063-0.63-1.536-1.379l-0.827-1.377l1.3-2.364c1.063-1.931,1.536-2.442,2.678-2.758c2.245-0.631,3.033-0.473,4.057,0.827c0.866,1.104,1.378,1.3,4.804,1.969c4.924,0.946,7.642,2.876,4.924,3.507c-0.709,0.156-1.103,0.788-1.812,2.913c-0.827,2.364-0.866,2.915-0.472,4.255c0.236,0.828,0.945,1.97,1.575,2.48c1.3,1.065,1.34,1.42,0.355,3.546c-0.709,1.576-0.788,1.615-3.625,2.126c-1.614,0.277-4.016,0.749-5.356,1.025C71.863,245.758,70.682,245.877,70.563,245.797z M75.447,236.66l2.561-0.709l0.118-2.128c0.158-3.111-0.275-3.505-3.664-3.189l-2.756,0.276l0.118,2.757c0.118,2.914,0.275,3.742,0.748,3.742C72.77,237.409,74.029,237.054,75.447,236.66z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '11',
                    name: 'Республика Коми',
                    path: 'M183.172,243.001c-4.018-1.615-5.869-1.772-10.517-0.907c-2.835,0.514-3.229,0.514-5.711-0.196c-2.56-0.708-2.718-0.827-3.702-2.718l-0.985-1.969l-2.954-0.274c-4.096-0.355-4.293-0.276-4.293,2.086c0,2.796-0.828,3.032-5.986,1.734c-4.215-1.024-4.57-0.985-6.184,0.746c-0.552,0.552-1.183,1.024-1.418,1.024c-0.473,0-1.773-3.899-1.773-5.316c0-0.394,0.592-1.379,1.339-2.166c1.024-1.143,1.497-2.245,2.048-4.529l0.709-3.032l1.418,0.236c4.333,0.826,4.569,0.786,5.632-0.631c0.67-0.867,0.945-1.654,0.828-2.284c-0.157-0.827,0.354-1.576,3.19-4.333c1.851-1.852,3.349-3.506,3.349-3.664c0-0.196-0.474-0.946-1.064-1.693c-0.985-1.182-1.3-1.339-2.955-1.339s-1.93,0.118-3.151,1.616c-1.221,1.456-1.457,1.574-2.206,1.18c-1.024-0.552-1.024-0.787-0.118-3.388c0.631-1.85,0.827-2.007,2.442-2.401l1.733-0.434l-0.119-2.363c-0.079-1.261,0.079-2.835,0.316-3.466c0.354-0.946,0.236-1.497-0.788-3.664c-0.945-2.008-1.104-2.678-0.71-2.915c0.907-0.551,1.812-0.354,3.939,0.907c3.27,1.93,4.293,2.718,4.687,3.743c0.276,0.785,0.591,0.944,2.088,0.944c0.945,0,2.875,0.354,4.253,0.787c1.379,0.395,2.521,0.749,2.561,0.788c0.04,0,0.512-0.631,1.063-1.419l0.946-1.417l-0.946-2.757l-0.906-2.757l1.024-2.048c0.551-1.103,1.418-2.639,1.93-3.427l0.905-1.457l7.248,0.078l7.248,0.04l6.066,3.979c4.293,2.796,7.641,4.647,11.383,6.223c2.914,1.261,6.026,2.6,6.893,2.954c5.711,2.561,5.042,2.442,8.074,1.616c1.852-0.474,3.23-1.144,4.333-2.088c1.024-0.866,2.167-1.458,3.151-1.575c1.103-0.158,1.851-0.592,2.796-1.616c1.812-2.087,3.742-1.771,2.127,0.355c-0.828,1.142-0.709,2.088,0.433,3.072l0.985,0.866l-1.103,1.576c-0.591,0.906-1.89,2.363-2.875,3.23c-1.654,1.495-2.127,1.691-5.515,2.283c-3.702,0.631-5.632,1.496-7.327,3.388c-0.353,0.394-1.89,1.102-3.347,1.536c-1.497,0.433-3.781,1.536-5.081,2.442c-2.166,1.496-2.442,1.613-2.797,0.983c-0.63-1.102-1.221-0.825-3.859,1.813c-2.127,2.166-2.482,2.757-2.639,4.216c-0.079,0.943-0.197,1.731-0.236,1.731c-0.079,0.039-1.182,0.907-2.521,1.929c-2.324,1.774-2.481,2.011-4.253,6.46c-2.836,6.973-3.86,8.941-4.766,9.021C187.072,244.379,185.142,243.789,183.172,243.001z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '89',
                    name: 'Ямало-Ненецкий автономный округ',
                    path: 'M289.596,264.783c-2.245-1.339-3.465-1.772-4.646-1.772c-1.418,0-1.813-0.238-3.625-2.208c-2.954-3.19-2.954-3.19-5.593-0.943l-2.284,1.969h-3.387h-3.427l-2.64-2.915l-2.638-2.914l-3.584-0.671c-3.308-0.668-3.821-0.904-6.263-2.834c-2.6-2.01-2.795-2.088-5.199-2.128h-2.481l-1.497-3.229c-0.945-2.13-1.458-3.821-1.458-4.886c0-1.495-0.196-1.811-2.048-3.467c-1.142-0.981-2.363-1.771-2.718-1.771c-0.394,0-1.772,0.314-3.151,0.747l-2.442,0.788l-1.654-0.984c-1.497-0.866-1.654-1.103-1.654-2.601c0-2.521-2.009-3.505-8.705-4.292c-4.018-0.473-4.057-0.473-5.002-1.892c-1.221-1.771-1.221-1.929,0-4.056c0.788-1.419,0.984-2.245,0.984-4.728v-3.032l1.182-0.236c0.629-0.158,2.047-1.063,3.111-2.008c1.812-1.656,2.245-1.813,5.436-2.365c4.726-0.825,4.372-0.668,7.483-3.621c2.048-1.972,2.954-3.151,3.309-4.373c0.433-1.459,0.433-1.771-0.079-2.049c-1.732-1.063-1.732-0.984-0.236-3.19c0.827-1.142,1.457-2.324,1.457-2.561c0-0.236-0.472-1.378-1.024-2.48c-1.024-2.049-1.024-3.151-0.039-3.151c0.275,0,2.244,2.639,4.371,5.909c2.757,4.174,4.097,5.908,4.609,5.908c0.473,0,1.22-0.708,1.969-1.891c1.537-2.441,1.734-3.348,0.946-4.569c-0.513-0.788-0.591-1.458-0.355-3.23c0.276-2.245,0.276-2.245-1.181-3.465l-1.497-1.221l0.945-1.181c0.474-0.631,1.575-2.561,2.363-4.294c1.378-3.033,1.419-3.19,0.828-4.215c-1.063-1.811-0.473-2.795,3.19-5.08c2.955-1.852,3.624-2.521,6.302-6.145c1.93-2.639,3.269-4.095,3.742-4.095c0.749,0,5.12,1.496,5.632,1.969c0.198,0.157,0.198,1.182,0.04,2.323c-0.237,1.733-0.669,2.521-2.954,5.396c-1.497,1.89-2.718,3.742-2.718,4.215c0,0.433,0.276,1.852,0.631,3.111c0.629,2.244,0.629,2.324-0.395,5.396c-0.551,1.733-1.023,3.466-1.023,3.86s-0.631,2.6-1.378,4.845c-0.749,2.245-1.379,4.451-1.379,4.884c0,0.434,0.472,1.891,1.024,3.19l0.984,2.403l-1.614,3.032c-0.905,1.653-1.772,3.033-1.969,3.033c-0.198,0-1.418,1.299-2.757,2.953c-2.323,2.876-2.403,2.954-4.175,2.954c-0.945,0-2.994-0.394-4.451-0.827c-5.514-1.692-6.499-0.433-2.678,3.466c2.717,2.797,5.633,4.413,7.876,4.452c2.363,0,6.934-2.324,8.666-4.491c0.827-1.022,2.56-2.56,3.86-3.427l2.324-1.574v-4.491c0-5.04,0.197-5.514,2.639-5.947c2.245-0.434,3.309,0.394,3.979,2.993c1.3,5.277,1.221,5.122,2.363,5.122c0.59,0,1.654-0.394,2.403-0.828l1.3-0.788l-0.277-2.836c-0.157-1.576-0.433-3.229-0.591-3.663c-0.196-0.474-1.536-1.692-2.993-2.757c-2.245-1.616-3.113-1.97-5.436-2.324c-2.442-0.355-2.795-0.513-3.032-1.378c-0.669-2.482-0.394-3.742,1.615-6.893c1.103-1.734,1.97-3.309,1.97-3.545c0-0.238-0.434-2.166-0.945-4.333c-1.104-4.412-0.985-4.923,1.417-7.13c2.009-1.89,4.845-3.781,4.964-3.387c0.079,0.236-0.511,2.049-1.261,4.136c-0.788,2.049-1.418,3.939-1.418,4.175c0,0.867,7.523,5.16,9.099,5.16c0.905,0,1.891-1.025,1.93-1.93c0-0.276-1.142-1.812-2.561-3.388c-1.418-1.575-2.561-3.151-2.561-3.466c0-1.063,0.788-1.22,1.735-0.315c0.983,0.906,1.85,1.025,3.033,0.394c1.023-0.511,0.944-1.26-0.276-3.348c-0.828-1.418-0.946-1.851-0.552-2.363c1.182-1.379,2.836-0.119,1.852,1.457c-0.394,0.63-0.355,0.866,0.118,1.26c0.354,0.236,1.417,1.301,2.362,2.363l1.694,1.891l-1.812,1.852c-1.024,1.023-1.852,2.048-1.852,2.285c0,0.275,0.788,1.338,1.773,2.441c1.89,2.048,2.047,2.796,1.338,5.239c-0.355,1.143-1.102,2.008-3.15,3.583c-1.457,1.143-2.757,2.285-2.875,2.561c-0.197,0.433,1.575,3.269,3.781,6.028c1.063,1.337,1.102,1.337,2.757,0.903c0.945-0.274,1.812-0.354,1.969-0.197c0.157,0.158,0.749,1.577,1.299,3.153l0.985,2.836l-1.969,3.897l-1.97,3.86l0.433,3.112c0.315,2.128,0.828,3.781,1.654,5.279c1.064,1.89,1.222,2.639,1.378,5.907c0.197,4.056,0.512,5.119,1.576,5.119c1.339,0,1.654,0.828,1.654,4.373c0,3.819,0.275,4.252,2.953,4.884c1.971,0.473,2.167,0.867,2.167,3.899c0,2.718-0.08,2.954-1.614,5.12l-1.655,2.286l0.669,2.047c0.354,1.142,0.629,2.323,0.629,2.64c0,0.708-3.86,5.079-4.451,5.079C292.827,266.554,291.251,265.729,289.596,264.783z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '09',
                    name: 'Карачаево-Черкесская Республика',
                    path: 'M20.581,335.443c-0.906-0.708-5.593-8.152-5.317-8.429c0.079-0.08,1.024-0.552,2.087-0.985l1.931-0.828l1.221,1.46l1.26,1.457l1.3-0.671c1.772-0.866,2.087-0.827,2.836,0.473c0.63,1.023,0.63,1.103,0,1.497c-0.63,0.395-0.63,0.553,0,2.205l0.63,1.813l-1.182,0.473c-0.629,0.275-1.772,0.904-2.481,1.417C21.566,336.192,21.526,336.192,20.581,335.443z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '20',
                    name: 'Чеченская Республика',
                    path: 'M34.8,354.231c-0.354-0.71-0.512-1.496-0.394-1.695c0.157-0.234,2.206-1.653,4.608-3.189c4.254-2.756,4.333-2.795,5.043-2.048c0.393,0.433,1.063,0.787,1.457,0.787c1.378,0,0.945,1.498-0.592,2.245c-1.063,0.514-1.496,1.024-1.969,2.483l-0.63,1.85l-2.835,0.275c-1.536,0.158-3.111,0.355-3.465,0.434C35.627,355.491,35.194,355.098,34.8,354.231z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '13',
                    name: 'Республика Мордовия',
                    path: 'M95.22,269.98c-2.441-1.181-3.387-1.457-3.701-1.142c-0.75,0.71-0.945,0.59-2.088-1.34c-0.709-1.219-1.892-2.362-3.742-3.585l-2.758-1.81l1.497-1.616c0.828-0.904,2.088-2.324,2.837-3.15c2.008-2.205,2.481-2.363,4.766-1.615l1.93,0.632v2.757c0,2.322,0.196,3.032,1.221,4.884c0.669,1.181,1.338,2.245,1.536,2.323c0.157,0.118,1.576-0.433,3.111-1.182c1.576-0.75,2.915-1.34,2.994-1.34c0.079,0,0.512,0.709,0.945,1.576l0.828,1.575l-1.182,2.364l-1.181,2.362l-1.891-0.039C99.001,271.597,97.583,271.162,95.22,269.98z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '61',
                    name: 'Ростовская область',
                    path: 'M45.711,319.412c-1.458-0.196-2.167-0.749-2.167-1.732c0-1.024-2.678-5.828-3.387-6.104c-0.315-0.119-0.945,0.234-1.378,0.825c-0.788,0.985-1.024,1.025-3.427,0.946l-2.638-0.118l-0.197-1.575c-0.119-0.866-0.828-2.443-1.536-3.506l-1.299-1.931l0.668-2.047l0.71-2.088l-1.458-1.812c-1.536-1.852-1.733-1.97-3.309-1.852c-0.709,0.079-0.906-0.077-0.787-0.63c0.119-0.591,0.512-0.709,1.969-0.709c1.024,0,2.087-0.237,2.363-0.552c0.551-0.552,0.039-1.103-2.639-3.072c-1.143-0.825-1.143-0.864-0.434-1.653c0.552-0.631,1.221-0.828,2.481-0.828c1.536,0,1.969,0.236,4.136,2.207l2.402,2.244l1.221-1.379c0.669-0.749,1.851-2.244,2.6-3.27c1.024-1.418,1.772-2.047,2.954-2.361c2.521-0.75,3.27-1.302,3.742-2.875c0.749-2.246,0.985-2.327,3.23-0.908c1.733,1.065,2.284,1.222,3.466,1.025c2.954-0.592,2.876-0.631,3.506,2.087c0.669,2.757,0.708,2.678-2.127,4.647c-0.788,0.552-0.788,0.552,0.119,2.246c0.906,1.691,0.906,1.731,0.236,3.15c-0.669,1.378-0.788,1.457-2.6,1.457c-1.97,0-4.253,0.866-4.253,1.576c0,0.236,0.275,0.984,0.629,1.614c0.512,1.023,0.552,1.536,0.197,2.954c-0.59,2.244,0.08,4.608,1.536,5.672c0.827,0.591,1.024,0.985,0.867,1.929c-0.158,1.184-0.119,1.222,1.497,1.222h1.614l-0.905,1.614c-0.906,1.617-0.906,1.617-2.757,1.38c-1.772-0.197-1.93-0.157-2.482,0.947C47.364,319.491,47.207,319.569,45.711,319.412z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '44',
                    name: 'Костромская область',
                    path: 'M118.222,241.07l-2.718-1.811l-1.457,0.866c-2.167,1.221-4.254,1.063-6.657-0.474c-1.654-1.063-1.969-1.417-1.85-2.243c0.118-0.71-0.316-1.458-1.93-3.112c-2.009-2.09-2.127-2.167-3.072-1.655c-1.024,0.513-3.072,0.354-4.175-0.315c-0.827-0.553,1.536-2.521,5.081-4.331c1.615-0.867,3.506-1.813,4.136-2.168c0.827-0.433,2.206-0.628,4.451-0.628c4.057,0,5.869,0.785,7.68,3.426c2.678,3.858,3.545,4.568,6.933,5.592c2.993,0.868,3.229,0.906,3.899,0.275c0.906-0.786,2.836-0.865,2.836-0.117c0,0.315-0.276,0.787-0.59,1.063c-0.394,0.315-0.591,1.183-0.591,2.563v2.086l-2.206-0.196c-1.851-0.157-2.442-0.039-3.663,0.748C120.546,243.159,121.216,243.12,118.222,241.07z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '77',
                    name: 'Москва',
                    path: 'M72.927,235.281c-0.118-0.473-0.236-1.418-0.236-2.088c0-1.183,0.118-1.26,1.732-1.537c2.246-0.313,2.6-0.078,2.6,1.813c0,1.732-0.078,1.773-2.245,2.284C73.281,236.068,73.124,236.029,72.927,235.281z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '18',
                    name: 'Удмуртская Республика',
                    path: 'M140.752,278.253c0.669-0.71,0.866-1.418,0.866-2.954c0-2.482-0.04-2.482-4.648-0.985c-3.229,1.064-3.308,1.064-3.86,0.315c-0.748-1.025-0.709-1.771,0.276-4.331c0.552-1.537,1.024-2.169,1.536-2.169c0.984,0,1.457-0.709,1.772-2.756c0.394-2.401,0.551-2.56,2.324-2.56c1.497,0,1.615-0.118,3.388-2.954c2.166-3.389,1.969-3.348,6.301-1.262l2.954,1.459l-0.118,2.757c-0.078,1.731-0.354,3.19-0.788,3.939c-0.394,0.628-1.104,2.125-1.576,3.347c-0.749,1.813-1.142,2.246-2.481,2.836c-1.417,0.59-1.575,0.786-1.338,1.575c0.748,2.324,0.55,2.757-1.97,3.703C140.319,279.436,139.649,279.436,140.752,278.253z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '51',
                    name: 'Мурманская область',
                    path: 'M144.887,166.354c-2.48-1.024-3.269-1.734-5.475-4.806c-2.245-3.151-3.939-7.838-4.765-13.273c-0.631-3.939-0.788-4.452-1.537-4.529c-0.59-0.08-1.299,0.433-2.481,1.851c-1.182,1.378-1.969,2.009-2.639,2.009c-1.26,0-1.497-0.709-0.748-2.481c0.551-1.378,0.551-1.418-0.513-2.324c-0.591-0.512-1.772-1.379-2.561-1.891c-1.575-1.064-1.694-1.418-0.985-2.954c0.473-1.063,0.591-1.143,4.058-1.812c3.151-0.592,3.978-1.183,4.292-2.994c0.985-5.672,1.458-7.129,2.521-7.602c3.86-1.772,5.16-2.009,9.886-1.575c7.012,0.63,7.129,0.669,7.129,1.772c0,0.827-0.196,0.985-1.182,0.985c-0.67,0-1.299,0.236-1.418,0.551c-0.394,0.985,0.985,4.963,3.033,8.902c1.852,3.505,2.009,4.018,2.561,8.666c0.315,2.677,0.945,5.947,1.379,7.247c0.906,2.797,0.906,4.687,0.039,9.886l-0.669,3.939l-2.363,0.63C149.3,167.456,147.33,167.377,144.887,166.354z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '86',
                    name: 'Ханты-Мансийский автономный округ',
                    path: 'M242.804,291.645c-3.504-1.3-4.686-2.009-4.686-2.836c0-0.235-1.221-2.481-2.718-4.963l-2.678-4.488l-4.451-2.562c-4.096-2.325-4.49-2.482-4.884-1.813c-1.891,3.19-4.411,4.806-9.256,5.947c-2.087,0.513-4.332,1.222-4.962,1.537c-2.048,1.063-2.836,0.827-3.741-1.144c-0.474-1.063-0.789-2.56-0.789-3.859v-2.126l-2.166-1.458c-2.363-1.574-2.442-1.812-1.733-4.844c0.394-1.694,0.354-2.089-0.394-3.428l-0.866-1.537l0.827-3.702l0.866-3.701l-2.481-4.175c-2.167-3.703-2.678-4.253-4.214-4.964c-1.3-0.551-1.891-1.102-2.324-2.206c-0.945-2.244-0.749-3.821,1.182-8.704c1.851-4.648,2.245-5.199,5.947-7.995c1.222-0.945,1.418-1.339,1.418-2.68c0-1.337,0.275-1.89,1.733-3.427c1.654-1.732,1.812-1.811,2.717-1.3c0.946,0.474,1.182,0.395,3.86-1.496c1.576-1.103,3.271-2.008,3.782-2.008c0.866,0,0.905,0.157,0.905,2.48c0,2.049-0.236,2.914-1.22,4.727l-1.222,2.245l1.418,1.891l1.378,1.892l4.254,0.511c2.639,0.313,5.002,0.828,6.262,1.379c1.97,0.906,2.008,0.946,1.97,2.599c-0.039,1.656,0.039,1.773,1.89,2.837l1.93,1.143l2.875-0.867l2.915-0.866l1.891,1.576c1.694,1.416,1.891,1.733,2.088,3.701c0.118,1.34,0.748,3.23,1.733,5.159l1.536,3.072h2.521c2.442,0,2.599,0.041,5.199,2.129c2.441,1.929,2.954,2.165,6.145,2.717l3.465,0.631l2.757,2.994l2.757,2.953h3.782h3.82l2.245-1.852l2.246-1.852l2.246,2.441c2.125,2.285,2.362,2.442,4.017,2.442c1.261,0,2.324,0.354,4.097,1.379c1.3,0.788,2.64,1.577,2.954,1.732c0.354,0.197,0.551,0.709,0.472,1.34c-0.236,1.93,1.3,4.492,3.427,5.829c1.102,0.669,1.891,1.419,1.772,1.614c-0.473,0.711-5.633,3.862-6.381,3.862c-0.394,0-1.063-0.354-1.457-0.789c-0.394-0.434-0.944-0.788-1.221-0.788c-0.276,0-1.891,0.828-3.545,1.851l-2.993,1.853l-2.916-1.498c-2.875-1.495-2.994-1.495-5.868-1.258c-2.915,0.275-2.955,0.275-3.387-0.75c-0.277-0.552-0.868-1.104-1.301-1.182c-1.654-0.314-7.996-0.552-8.391-0.275c-0.235,0.156-1.141,2.166-2.007,4.45c-2.206,5.869-2.206,5.869-3.977,5.869c-1.418,0-1.695,0.196-3.979,2.914c-1.378,1.655-2.796,2.954-3.111,2.954C246.467,292.904,244.656,292.314,242.804,291.645z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '05',
                    name: 'Республика Дагестан',
                    path: 'M39.054,371.995c-0.118-0.473-0.236-2.128-0.236-3.623c0-2.603-0.079-2.836-2.009-5.751c-1.773-2.717-1.93-3.189-1.693-4.491c0.314-1.771,1.182-2.166,4.884-2.166c2.954,0,2.994-0.04,3.939-2.559c0.354-0.869,0.984-1.774,1.457-2.01c1.732-0.828,2.127-1.458,2.009-2.875c-0.079-1.222-0.276-1.46-1.181-1.538c-1.064-0.156-1.615-0.746-3.388-3.7l-0.867-1.419l3.388-1.85l3.387-1.893l2.126,2.128c2.324,2.284,2.482,2.6,1.458,2.994c-1.93,0.669-2.088,1.142-1.812,5.631c0.275,4.727,0.315,4.531-2.679,8.468l-1.496,2.01l-0.118,6.264l-0.119,6.301l-1.969,0.434c-1.064,0.273-2.6,0.471-3.388,0.511C39.566,372.901,39.251,372.743,39.054,371.995z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '69',
                    name: 'Тверская область',
                    path: 'M82.892,226.222c-0.749-0.671-2.087-1.103-4.766-1.574c-3.427-0.631-3.781-0.789-4.805-2.089c-1.063-1.34-1.182-1.378-2.875-1.102c-0.984,0.117-2.008,0.313-2.245,0.433c-0.277,0.078-1.3-0.906-2.324-2.206l-1.851-2.363h-2.639c-1.497-0.039-2.875-0.157-3.112-0.315c-0.591-0.394-4.096-6.065-4.096-6.617c0-0.275,0.552-0.708,1.182-0.945c1.457-0.63,1.772-1.181,2.166-3.74c0.473-3.348,1.458-4.255,2.64-2.483c0.434,0.67,1.496,1.064,4.49,1.695c2.127,0.473,4.451,1.103,5.16,1.378c1.103,0.472,1.497,0.433,3.899-0.59l2.639-1.143l2.285,2.44c1.969,2.128,2.402,2.402,3.072,2.05c1.182-0.632,1.852-0.512,3.86,0.786c1.378,0.867,2.324,1.183,3.703,1.183c1.615,0,1.89,0.118,2.087,0.944c0.354,1.418-0.354,2.837-2.441,4.885c-2.325,2.245-3.703,5.514-2.876,6.813c0.433,0.709,0.355,0.986-0.551,2.128c-0.552,0.748-1.143,1.378-1.3,1.339C84.035,227.128,83.443,226.733,82.892,226.222z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '76',
                    name: 'Ярославская область',
                    path: 'M84.744,231.106c-0.868-0.946-0.592-2.01,1.141-4.137c1.773-2.244,1.852-2.441,1.339-3.426c-0.748-1.38,0.276-3.782,2.639-6.145c2.639-2.6,3.506-2.639,5.593-0.395l1.577,1.654l1.102-0.748c0.985-0.67,1.103-0.67,1.576-0.039c0.473,0.669,1.339,5.632,1.339,7.876c0,1.025-0.197,1.38-0.905,1.538c-0.473,0.117-1.812,1.063-2.994,2.047c-1.654,1.42-2.324,1.773-2.954,1.537c-1.418-0.473-6.185-0.158-6.814,0.434C86.594,232.091,85.531,232.011,84.744,231.106z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '32',
                    name: 'Брянская область',
                    path: 'M40.078,243.75c-0.433-0.276-0.433-0.63-0.039-1.932c0.708-2.48,0.394-2.835-2.521-2.835h-2.521l-0.276-2.008c-0.237-1.774-0.395-2.05-1.615-2.64c-0.748-0.354-1.379-0.867-1.379-1.182c0-0.671,3.073-5.198,3.545-5.198c0.197,0,0.473,0.352,0.591,0.746c0.394,1.223,5.672,2.443,6.735,1.576c0.354-0.314,2.127-0.63,4.136-0.748c3.23-0.197,3.466-0.157,3.663,0.591c0.433,1.575,0.196,2.718-0.788,4.058c-1.26,1.574-1.969,4.647-1.299,5.435c0.354,0.434,0.276,0.552-0.355,0.552c-0.473,0-1.458,0.789-2.441,1.97c-1.498,1.772-1.812,1.97-3.27,1.97C41.338,244.064,40.354,243.946,40.078,243.75z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '53',
                    name: 'Новгородская область',
                    path: 'M85.492,208.025c-1.182-0.749-1.93-0.946-2.955-0.788c-1.26,0.196-1.575,0-3.624-2.048l-2.284-2.245l-1.654,0.668c-0.946,0.355-2.246,0.867-2.915,1.144c-1.024,0.395-1.457,0.395-2.561-0.157c-0.748-0.315-2.678-0.828-4.292-1.104c-2.363-0.395-3.23-0.709-4.215-1.653l-1.26-1.222l2.599-2.915l2.6-2.875l-0.473-1.536c-0.236-0.788-0.433-1.93-0.433-2.481c0-0.867,0.197-1.023,1.497-1.182c0.788-0.078,2.009-0.394,2.679-0.709c1.103-0.433,1.339-0.433,2.087,0.315c1.063,0.946,3.781,1.458,6.026,1.063c1.891-0.315,2.639,0.434,2.679,2.678c0,1.458,0.04,1.497,1.575,1.497h1.576l1.615,3.427c2.048,4.452,2.166,5.001,1.338,6.302c-0.669,0.985-0.669,1.063,0.08,1.654c0.472,0.355,1.102,0.787,1.496,1.023c0.395,0.236,0.63,0.749,0.551,1.262l-0.157,0.826L85.492,208.025z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '02',
                    name: 'Республика Башкортостан',
                    path: 'M144.651,322.405c-1.299-1.063-1.615-1.181-2.481-0.788c-1.024,0.475-3.781,0.631-4.175,0.237c-0.117-0.117-0.039-0.825,0.197-1.575c0.276-0.867,0.276-1.616,0.04-2.206c-0.276-0.629-0.197-1.457,0.314-2.994c1.024-3.15,1.024-3.228-1.221-3.228h-1.93l0.197-2.089c0.197-1.851,0-2.561-1.615-6.342c-1.457-3.466-1.812-4.688-1.812-6.578c0-2.126,0.158-2.599,1.851-5.121c1.3-1.969,1.93-3.348,2.088-4.607l0.197-1.85l2.954-0.907c3.544-1.104,3.86-1.339,3.19-2.6c-0.789-1.419-0.433-1.81,2.205-2.834l2.443-0.908l0.984,1.299c0.789,1.064,1.339,1.34,2.955,1.576c2.087,0.276,2.954,1.065,4.373,3.9c0.314,0.628,1.023,1.3,1.575,1.498c0.552,0.233,1.339,0.707,1.773,1.101c1.497,1.341,6.105,3.664,6.893,3.468c0.985-0.276,0.985,0.354,0.04,3.072l-0.709,1.971l-2.245,0.114c-2.364,0.119-3.978-0.55-5.554-2.283c-0.393-0.434-0.945-0.787-1.26-0.787c-0.985,0-4.845,2.835-4.845,3.546c0,1.22,2.048,5.474,2.718,5.669c2.678,0.789,6.459,1.42,7.996,1.34c1.023-0.039,2.008,0.04,2.127,0.159c0.157,0.157-0.197,1.063-0.788,2.047c-0.985,1.695-1.063,1.734-2.206,1.34c-0.669-0.237-1.576-0.315-2.088-0.196c-1.023,0.275-5.001,3.938-5.001,4.607c0,0.276-0.788,2.403-1.813,4.727c-1.417,3.387-1.969,4.294-2.639,4.41c-0.512,0.042-1.182,0.672-1.654,1.576c-0.433,0.828-0.946,1.498-1.182,1.457C146.345,323.626,145.479,323.076,144.651,322.405z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '72',
                    name: 'Тюменская область',
                    path: 'M212.634,315.67c-3.348-1.142-3.703-1.338-4.096-2.52c-0.197-0.709-1.104-1.851-1.93-2.521c-0.867-0.671-1.773-1.695-2.049-2.246c-0.669-1.378-3.269-3.111-5.121-3.386c-1.339-0.237-1.576-0.473-2.678-2.642c-1.378-2.834-1.457-3.465-0.394-4.804c0.551-0.71,0.787-1.615,0.787-3.033c0-1.338,0.316-2.638,0.986-3.938c1.063-2.087,1.378-2.207,6.104-2.481l1.773-0.078l0.118-2.089c0.118-1.93,0.197-2.048,1.142-2.048c0.591,0,1.773-0.354,2.639-0.749c0.906-0.431,3.191-1.141,5.121-1.613c3.939-0.946,7.366-2.995,8.153-4.845c0.237-0.59,0.63-1.063,0.867-1.063c0.236,0,2.126,0.942,4.214,2.125c3.781,2.165,3.82,2.208,6.026,5.83c1.221,2.008,2.561,4.451,2.993,5.476c0.788,1.771,0.906,1.851,4.451,3.071c2.009,0.709,3.82,1.417,4.017,1.614c0.158,0.158-0.629,0.946-1.771,1.694c-2.127,1.339-2.127,1.378-4.885,0.983c-3.703-0.472-6.775-1.022-8.547-1.534c-1.3-0.355-1.536-0.631-2.324-2.758c-0.592-1.576-1.064-2.322-1.537-2.322c-0.394,0-1.417,1.18-2.6,3.031c-1.811,2.875-1.93,3.229-1.93,5.749c0,2.798,0.354,3.389,2.009,3.429c1.182,0,1.654,0.708,1.93,2.994l0.275,1.969l-2.206,0.512l-2.245,0.473l-2.245,4.528c-1.418,2.875-2.442,4.452-2.836,4.452C216.533,316.893,214.604,316.341,212.634,315.67z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '35',
                    name: 'Вологодская область',
                    path: 'M124.327,232.523c-2.442-0.787-2.678-0.984-4.648-3.78c-1.693-2.403-2.481-3.151-4.332-4.096c-2.166-1.104-2.402-1.144-6.026-0.867c-2.639,0.197-4.097,0.473-5.042,1.024c-0.748,0.433-1.457,0.707-1.536,0.63c-0.119-0.12-0.433-1.891-0.709-4.019c-0.433-2.913-0.748-4.017-1.418-4.766c-0.984-1.024-1.576-1.144-2.757-0.434c-0.709,0.434-0.945,0.354-2.008-1.022c-0.669-0.828-1.654-1.656-2.167-1.853c-0.708-0.276-0.905-0.631-0.905-1.653c0-1.734-0.591-2.246-2.639-2.246c-1.654,0-1.694-0.04-1.694-1.299c0-0.946-0.315-1.537-1.26-2.324c-1.261-1.023-1.301-1.063-0.513-1.891c0.395-0.474,1.813-1.497,3.151-2.244c3.27-1.971,3.742-2.442,3.742-3.704c0-0.827,0.552-1.575,2.482-3.269c1.378-1.182,2.954-2.363,3.465-2.56c0.631-0.236,2.481-0.236,4.687-0.079c3.584,0.315,3.742,0.354,5.002,1.733l1.3,1.418l-1.182,3.19c-0.63,1.773-1.182,3.427-1.182,3.663c0,0.67,5.987,6.973,6.617,6.973c0.276,0,0.669,0.433,0.866,0.943c0.236,0.67,1.339,1.459,3.427,2.521c2.008,1.024,3.506,2.089,4.332,3.112l1.261,1.576l2.009-0.395c2.245-0.433,2.757-0.157,2.757,1.577c0,1.062,1.338,1.495,3.505,1.141c1.418-0.235,1.576-0.158,2.009,0.985c0.275,0.631,0.945,1.457,1.457,1.811c0.906,0.592,1.143,1.773,0.669,3.033c-0.117,0.315-1.299,1.064-2.56,1.655c-2.403,1.063-2.836,1.85-1.654,2.717c0.551,0.395,0.63,0.71,0.275,1.617c-0.354,1.022-0.512,1.101-2.047,1.022c-1.024-0.078-1.97,0.078-2.521,0.473C127.479,233.587,127.479,233.587,124.327,232.523z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '39',
                    name: 'Калининградская область',
                    path: 'M14.122,179.627c-0.631-0.828-2.363-3.27-3.861-5.396c-2.914-4.215-2.914-4.569-0.117-4.569c1.221,0,1.576,0.197,2.245,1.3c0.433,0.709,1.181,1.615,1.614,2.049c0.788,0.708,0.828,0.708,1.97-0.119c0.709-0.552,1.221-0.709,1.378-0.473c0.434,0.67,2.167,6.42,2.167,7.168c0,0.828-0.197,0.945-2.402,1.3C15.382,181.124,15.264,181.084,14.122,179.627z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '87',
                    name: 'Чукотский автономный округ',
                    path: 'M536.519,117.985c-1.734-1.458-1.971-1.576-2.916-1.143c-0.944,0.433-1.143,0.315-2.56-1.024l-1.498-1.497l-3.15,0.119l-3.189,0.118l-1.537-1.693c-1.497-1.615-1.576-1.852-1.576-4.215c0-2.285,0.118-2.639,1.38-4.175c1.023-1.221,1.379-2.047,1.379-3.111c0-1.023,0.354-1.891,1.259-2.993c1.222-1.537,1.222-1.537,0.475-2.364c-1.42-1.576-4.293-3.388-6.854-4.293c-1.419-0.512-2.718-1.063-2.914-1.261c-0.552-0.473,0.629-2.718,3.858-7.208c3.388-4.648,3.782-5.357,3.782-6.657c0-0.551,0.235-1.142,0.472-1.299c0.277-0.158,2.442-0.394,4.807-0.551c2.717-0.197,4.451-0.473,4.766-0.828c0.669-0.709,1.023-5.671,0.434-6.38c-0.275-0.394-1.419-0.631-3.389-0.709c-2.362-0.117-3.189-0.314-4.214-1.102c-0.708-0.513-1.3-1.222-1.3-1.497c0-0.552,4.332-8.469,6.814-12.407c1.221-1.97,5.789-6.224,11.344-10.517c5.474-4.253,19.023-13.391,19.851-13.391c0.434,0,1.771,0.354,2.954,0.788c1.183,0.433,2.521,0.788,2.954,0.748c1.064,0,5.082-2.836,5.277-3.703c0.197-0.984-0.513-1.299-3.781-1.614c-2.913-0.276-3.505-0.71-2.283-1.733c0.314-0.276,0.944-1.654,1.377-3.112c0.789-2.599,0.789-2.639,4.019-4.726c1.733-1.182,3.465-2.206,3.82-2.285c0.354-0.079,1.261,0.395,2.009,1.025l1.378,1.143l-0.709,2.678c-1.182,4.608-1.378,4.412,5.83,5.672c2.562,0.433,4.922,0.984,5.199,1.221c1.3,1.103,0,3.899-1.812,3.899c-1.379,0-1.892,0.433-3.979,3.268c-1.575,2.167-1.733,2.325-2.993,2.127c-1.104-0.196-1.615,0-3.268,1.34c-2.051,1.615-2.207,1.89-2.602,4.49c-0.512,3.151-0.276,2.954-3.86,2.678c-3.977-0.275-4.371,0-3.977,2.994c0.156,1.063,0.471,2.245,0.708,2.561c0.276,0.393,1.891,0.827,4.333,1.181c2.127,0.315,4.058,0.709,4.214,0.906c0.198,0.196,0.71,1.733,1.143,3.466l0.786,3.112l-1.73,2.56c-2.168,3.112-1.971,3.584,1.496,3.584c2.126,0,2.678-0.197,4.451-1.378c2.284-1.537,2.521-1.576,5.632-0.946c1.929,0.394,2.441,0.354,4.569-0.394c3.15-1.103,4.137-1.063,5.436,0.276l1.103,1.143l-2.954,3.15l-2.955,3.151l1.537,6.223c0.866,3.427,1.497,6.459,1.379,6.736c-0.158,0.393-1.023,0.551-2.993,0.551h-2.757v1.772c0,1.024-0.436,2.796-0.985,4.136c-0.552,1.261-0.985,2.915-0.985,3.624s-0.236,2.166-0.512,3.269l-0.512,1.97l-2.757,0.197c-2.443,0.157-2.954,0.354-4.254,1.457c-0.789,0.709-1.656,1.3-1.932,1.3c-0.235-0.039-1.142-1.261-1.968-2.757c-1.655-3.151-1.733-3.151-5.947-2.167c-3.427,0.788-3.625,0.867-4.097,1.93c-0.276,0.669-0.866,1.023-1.932,1.182c-1.337,0.236-1.652,0.55-3.03,2.835c-0.828,1.418-2.482,3.388-3.625,4.373c-3.229,2.757-4.096,4.215-4.096,6.893c0,2.678-0.671,3.308-3.979,3.702c-1.655,0.197-2.402,0.512-3.662,1.694c-1.379,1.221-6.539,3.545-7.916,3.545C538.604,119.64,537.541,118.891,536.519,117.985z M522.338,36.177c-1.3-1.417-1.457-1.811-1.457-3.741c0-1.851,0.117-2.166,0.905-2.402c0.473-0.158,1.338-0.591,1.931-1.025c0.551-0.393,1.22-0.708,1.457-0.708c1.023,0,0.079,8.979-0.984,9.334C523.952,37.713,523.124,37.044,522.338,36.177z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '91',
                    name: 'Республика Крым',
                    path: 'm 2.5872442,296.90444 -0.3855516,0.0884 -0.4990715,-0.58139 -0.1604727,0.10645 0.049984,0.25205 -0.5385434,-0.12692 -0.031301,0.20319 -0.46787743,0.17075 -0.48246719,0.92202 -0.57947869,-0.11055 -0.51138619,-0.43402 -0.301872,-0.008 -0.6817378,-0.95615 -1.0736084,-0.53726 0.14154,-0.68668 -0.1154455,-0.58195 -0.301098,-0.578 -0.4309221,-0.27875 -0.8619252,-0.0761 -0.143579,0.16077 0.073702,0.22588 -0.4221735,-0.13279 -0.1301925,0.34628 -0.4171568,-0.61174 -0.3751872,0.18611 -0.448908,-0.19446 -0.5568304,0.30882 -0.3810261,-0.0143 0.0071,-0.42946 -0.2040492,-0.33128 -0.4380797,-0.15372 -0.7125263,-0.66015 -0.7254646,-0.27642 -1.0077629,-0.25687 -1.205242,0.30404 -0.21191,0.19718 -0.143205,-0.20058 -0.513929,0.0474 -0.414914,-0.2702 -0.552419,0.21845 -0.858983,-0.44739 -0.30828,-0.4505 0,0 0.448432,-0.058 0.447309,-1.17172 -0.141062,-0.62999 0.626473,-0.3539 -0.08152,-0.33348 -0.41561,-0.17864 0.07672,-0.31246 0.338963,0.16934 0.14533,-0.22636 -0.424155,-0.66613 0,0 0.194275,-0.15744 0.388202,0.0489 0.757245,-0.77443 0.354459,-0.69579 0.07357,-1.01161 -0.135521,-0.38998 -0.826014,-0.23726 -0.186257,-2.74327 -0.598815,-0.64372 -0.747601,-0.13641 -0.45738,-0.84655 0.249411,-0.0849 -0.01269,-0.27216 0.959538,-0.0608 1.327509,0.35213 0.09619,0.20094 0.214535,-0.0574 -0.01475,-0.16942 0.67645,0.0578 1.4119005,0.47891 0.4986946,-0.15492 0.1133386,0.37778 0.6624961,0.25836 0.6075745,0.004 0.034607,0.16184 0.3356025,-0.0311 0.1308087,0.36031 0.6252335,-0.0383 -0.00457,0.57918 0.3806241,-0.40519 0.4624356,0.20549 0.075797,-0.19612 -0.5602926,-0.50791 0.6338113,-0.65591 0.2999988,-0.0667 0.2013694,-0.42728 0,0 0.1171303,0.0548 0.4392322,-0.61849 0.1427555,0.10034 0,0 -0.043557,1.28609 0.3330589,-0.0237 0.063939,-0.26038 0.1409548,0.16844 -0.1198695,0.29423 -0.3962906,0.0378 0.2274289,0.81621 0.259681,0.18233 -0.1589932,-0.39598 0.1239419,-0.0233 0.3653835,0.27062 0.083331,0.41761 -0.132913,0.22133 0.1234983,0.65982 -0.3812363,0.0104 -0.090875,-0.24309 -0.056891,0.46453 0.3821018,0.1925 0.2816047,-0.55663 -0.1469622,-0.0372 -0.038432,-0.46251 0.1516829,-0.0903 0.2974581,0.56691 -0.2137267,0.42491 0.4645626,-0.22146 -0.2402256,0.33354 0.074679,0.25929 0.2248555,-0.10944 -0.020997,-0.16073 0.2330291,0.1083 -0.1856274,0.62764 0.05833,0.60713 -0.3229032,0.30326 0.5068409,-0.0918 0.1626844,0.24003 0.3186543,-0.54948 0.119212,0.57573 -0.4283595,0.3375 -0.456608,-0.15975 -0.5210606,0.16746 -0.2199714,-0.19502 -0.068196,0.17378 0.3681259,0.23841 0.9094408,0.0139 0.5674691,0.22569 -0.1749402,0.21423 -0.01711,-0.18425 -0.3876783,-0.11326 -0.4043309,0.27171 0.5325941,0.2532 -0.054399,0.30732 -0.8957412,-0.0251 0.00476,0.18187 1.0319187,0.4881 -0.4278388,-0.0412 -0.091977,0.20738 0.2804726,0.056 -0.1722098,0.33918 0.3919924,0.19243 -0.1493238,0.10512 0.1154856,0.41984 -0.2397247,0.74067 -0.3420753,0.53853 -0.6220018,-0.0582 -0.2309507,0.72699 0.6411871,1.54675 -0.2544433,0.0973 -0.046385,0.23547 0.2294673,-0.0699 0.3810938,0.32123 0.2305182,-0.20105 -0.1690666,-0.21646 0.067232,-0.993 0.5100024,-2.99998 0.36222,-0.89509 0,0 0.1049428,0.0326 0,0 -0.4501266,1.37098 -0.3985397,2.36056 -0.044052,0.87895 0.1770759,0.76833 1.1342822,0.53307 0.3915747,-0.0674 0.08049,-0.16398 0.90513852,-0.0678 0.0533397,0.14066 -0.22147587,-0.004 -0.0763039,0.26047 0.14263285,0.74385 0.45736605,0.22037 0.47454731,-0.23144 1.02702803,0.63787 0.3184425,0.73255 0.3249958,0.21523 0.1233822,0.51754 0.2629259,0.0833 -0.1041766,0.49953 -1.4e-6,1e-5 1.2e-6,0 -1.3e-6,10e-6 -2.5e-6,0 -1.3e-6,1e-5 -6.2e-6,0 -2.5e-6,10e-6 z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '92',
                    name: 'Севастополь',
                    path: 'm -14.072743,287.36865 0.424152,0.66613 -0.144512,0.12218 -0.29746,-0.14883 -0.120003,0.51759 0.421767,0.17248 0.07633,0.21817 -0.626485,0.35392 0.141043,0.62999 -0.47832,1.1407 -0.41725,0.0682 -0.06169,-0.1037 -0.633784,-0.36621 0.07441,-0.3347 -0.205856,-0.25825 0.220525,-0.50292 -0.477982,-0.58775 0.04462,-0.95074 0.350589,0.10861 0.708107,0.59338 -0.219299,-0.4388 0.396764,-0.0972 0.824303,-0.8022 5e-6,-10e-6 2e-6,0 7e-6,0 2e-6,-1e-5 5e-6,0 3e-6,0 z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                },
                {
                    id: '99',
                    name: 'Байконур',
                    path: 'm160.927,365.28101c-0.11801,-0.47299 -0.23599,-1.418 -0.23599,-2.08801c0,-1.18298 0.11798,-1.25998 1.73199,-1.53699c2.246,-0.31299 2.60001,-0.078 2.60001,1.81299c0,1.73199 -0.078,1.77301 -2.24501,2.284c-1.49699,0.315 -1.65401,0.27603 -1.851,-0.47198z',
                    fill: '#dfdfdf',
                    plan: 0,
                    real: 0,
                    percentage: 0
                }
            ]);

(function (angular) {'use strict';
    publicStatisticMonthYears.$inject = ["$filter"];
    angular.module('pafo-common-web-package')
        .factory('publicStatisticMonthYears', publicStatisticMonthYears);

    /* @ngInject */
    function publicStatisticMonthYears($filter) {
        return function (monthYearPairs) {
            var dateFilter = $filter('date'),

                monthYearPairMap = monthYearPairs.reduce(function(map, pair) {
                    map[dateFilter(new Date(pair.year, pair.month - 1), 'MMMM yyyy')] = pair;
                    return map;
                }, {});


            return {
                list: getList,
                pair: getPair,
                find: find
            };

            function getList() {
                return Object.keys(monthYearPairMap);
            }

            function getPair(monthYear) {
                return monthYearPairMap[monthYear];
            }

            function find(month, year) {
                return getList().filter(function (monthYear) {
                    var pair = getPair(monthYear);
                    return pair.month === month && pair.year === year;
                })[0];
            }
        };
    }
})(angular);

(function (angular) {'use strict';
    angular.module('pafo-common-web-package')
        .factory('publicStatisticNumeralCoherentText', numeralCoherentText);


    function numeralCoherentText() {
        var _11_12_13_14 = ['11', '12', '13', '14'],
            _2_3_4 = ['2', '3', '4'];

        return function (num, text1, text2, text3) {
            var numStr = String(num);

            if (numStr.length > 1 && _11_12_13_14.indexOf(numStr.substr(numStr.length - 2, 2)) > -1) {
                return text3; // пример: 12 платежных документов, содержащих начисление, участвовало в расчете
            }

            if (numStr.charAt(numStr.length - 1) === '1') {
                return text1; // пример: 1 платежный документ, содержащий начисление, участвовал в расчете
            }

            if (_2_3_4.indexOf(numStr.charAt(numStr.length - 1)) > -1) {
                return text2; // пример: 3 платежных документа, содержащих начисление, участвовало в расчете
            }

            return text3; // пример: 10 платежных документов, содержащих начисление, участвовало в расчете
        };
    }
})(angular);

(function (angular) {'use strict';
    angular.module('pafo-common-web-package')
        .factory('publicStatisticQuarterYears', publicStatisticQuarterYears);


    function publicStatisticQuarterYears() {
        return function (quarterYearPairs) {
            var ROMA_QUARTERS = {1:'I', 2:'II', 3:'III', 4:'IV'},

                quarterYearPairMap = quarterYearPairs.reduce(function(map, pair) {
                    map[ROMA_QUARTERS[pair.quarter]  + ' квартал ' + pair.year] = pair;
                    return map;
                }, {});


            return {
                list: getList,
                pair: getPair
            };

            function getList() {
                return Object.keys(quarterYearPairMap);
            }

            function getPair(quarterYear) {
                return quarterYearPairMap[quarterYear];
            }
        };
    }
})(angular);

(function (angular) {'use strict';
    rangeIcon.$inject = ["MAP_COLORS"];
    angular.module('pafo-common-web-package')
        .factory('publicStatisticRangeIcon', rangeIcon);

    /* @ngInject */
    function rangeIcon(MAP_COLORS) {
        var rangeIcons = {};

        rangeIcons[MAP_COLORS.BLUE_COLOR] = 'lico0';
        rangeIcons[MAP_COLORS.GREY_COLOR] = 'wlico1';
        rangeIcons[MAP_COLORS.GREEN_COLOR] = 'wlico2';
        rangeIcons[MAP_COLORS.YELLOW_COLOR] = 'wlico3';
        rangeIcons[MAP_COLORS.ORANGE_COLOR] = 'wlico4';
        rangeIcons[MAP_COLORS.RED_COLOR] = 'wlico5';

        return function (color) {
            return rangeIcons[color];
        };
    }
})(angular);

(function (angular) {'use strict';
    publicStatisticRange.$inject = ["MAP_COLORS"];
    angular.module('pafo-common-web-package')
        .factory('publicStatisticRange', publicStatisticRange);

    /* @ngInject */
    function publicStatisticRange(MAP_COLORS) {
        return function (values, param) {
            var ranges = makeRanges(values, param);

            return {
                list: rangeList,
                color: rangeColor,
                icon:rangeIcon
            };

            function rangeList() {
                return ranges;
            }

            function makeRanges(values, param) {
                var minValue = null,
                    maxValue = null,

                    delta,

                    maxRangesLength = 4,
                    rangesLength = values.length < maxRangesLength ? values.length : maxRangesLength,

                    rangeColors = [
                        MAP_COLORS.GREEN_COLOR,
                        MAP_COLORS.YELLOW_COLOR,
                        MAP_COLORS.ORANGE_COLOR,
                        MAP_COLORS.RED_COLOR
                    ],

                    ranges = [];

                values.forEach(function (value) {
                    var val = value[param];

                    if (minValue === null || val < minValue) {
                        minValue = val;
                    }
                    if (maxValue === null || val > maxValue) {
                        maxValue = val;
                    }
                });

                delta = maxValue - minValue;

                for (var i = 0, range, prevRange; i < rangesLength; i++) {
                    range = {
                        begin: rangeValue(i),
                        end: rangeValue(i + 1),
                        color: rangeColors[i],
                        style: 'wlico' + (i + 2)
                    };

                    if (!prevRange || (prevRange.begin !== range.begin || prevRange.end !== range.end)) {
                        ranges.push(range);
                        prevRange = range;
                    }
                }

                if (ranges.length) {
                    ranges[0].begin = 0;
                }

                return ranges;


                function rangeValue(i) {
                    return Math.round((minValue + delta * i / rangesLength) * 100) / 100;
                }
            }

            function rangeColor(value) {
                var color = MAP_COLORS.GREY_COLOR;

                for (var i = 0, range; i < ranges.length; i++) {
                    range = ranges[i];
                    if (value >= range.begin && value <= range.end) {
                        color = range.color;
                        break;
                    }
                }

                return color;
            }

            function rangeIcon(value) {
                var icon = 'wlico1';

                for (var i = 0, range; i < ranges.length; i++) {
                    range = ranges[i];
                    if (value >= range.begin && value <= range.end) {
                        icon = range.style;
                        break;
                    }
                }

                return icon;
            }
        };
    }
})(angular);

(function (angular) {'use strict';
    widgetRestResource.$inject = ["BackendResource", "PUBLIC_STATIC_SEARCH_URL"];
    angular.module('pafo-common-web-package')
        .constant('PUBLIC_STATIC_SEARCH_URL', '/search/api/rest/services')
        .factory('publicStatisticWidgetRestResource', widgetRestResource);

    /* @ngInject */
    function widgetRestResource(BackendResource, PUBLIC_STATIC_SEARCH_URL) {
        return function (url) {
            return new BackendResource({baseUrl: PUBLIC_STATIC_SEARCH_URL}, '/widget' + url);
        };
    }
})(angular);

(function (angular) {'use strict';
    WdgtContributionSize2Ctrl.$inject = ["$state", "publicStatisticWdgtContributionSize2Rest", "intanBigNumber", "publicStatisticError", "MapData", "MAP_COLORS", "publicStatisticRangeIcon", "publicStatisticNumeralCoherentText", "$filter", "publicStatisticMonthYears", "$log"];
    angular.module('pafo-common-web-package')
        .controller('publicStatisticWdgtContributionSize2Ctrl', WdgtContributionSize2Ctrl);

    /* @ngInject */
    function WdgtContributionSize2Ctrl($state, publicStatisticWdgtContributionSize2Rest, intanBigNumber,
                                       publicStatisticError, MapData, MAP_COLORS, publicStatisticRangeIcon,
                                       publicStatisticNumeralCoherentText, $filter, publicStatisticMonthYears, $log) {
        var vm = this,
            bn = intanBigNumber,
            currencyFilter = $filter('currency'),
            monthYears;

        vm.pageTitle = $state.current.data.pageTitle;
        vm.breadcrumbs = $state.current.data.breadcrumbs;

        vm.search = search;

        vm.setRegion = function (region) {vm.region = region;};
        vm.regionValueAvailable = regionValueAvailable;
        vm.percentAvailable = percentAvailable;
        vm.numeralCoherentText = publicStatisticNumeralCoherentText;


        publicStatisticWdgtContributionSize2Rest.options()
            .then(setOptionsAndSearch, publicStatisticError);


        function setOptionsAndSearch(options) {
            if (!options.length) {
                $log.debug('No options');
                return;
            }

            monthYears = publicStatisticMonthYears(options);

            vm.monthYears = monthYears.list();

            vm.searchParams = {monthYear: vm.monthYears[0]};

            search();
        }

        function search() {
            var monthYearPair = monthYears.pair(vm.searchParams.monthYear),

                searchParams = {
                    month: monthYearPair.month,
                    year: monthYearPair.year
                };

            return publicStatisticWdgtContributionSize2Rest.data(searchParams)
                .then(displayMap, publicStatisticError);
        }

        function displayMap(data) {
            var regions = angular.copy(MapData),

                regionsByCode = regions.reduce(function(map, region) {
                    map[region.id] = region;
                    return map;
                }, {}),

                range;

            vm.date = Date.now();//TODO: Данные по состоянию на

            vm.averageCharged = data.averageTariff;

            calculateAverageValues(data.territoryData);

            range = contributionSizeRange(vm.weightedAverageChargedByTotalArea);

            vm.ranges = getDisplayRanges(range.list());

            data.territoryData.forEach(function (data) {
                var region = regionsByCode[data.territoryCode];

                region.value = data.value; // charged - начислено взносов на капитальный ремонт
                region.percent = bn(region.value).div(vm.weightedAverageChargedByTotalArea)
                    .times(100).round().toNumber();

                region.documentCount = data.count;
                region.fill = range.color(data.value);
            });

            vm.regions = regions;
        }

        function calculateAverageValues(data) {
            var totalAreaSum = bn(0),
                chargedTotalAreaSum = bn(0);

            data.forEach(function(region) {
                totalAreaSum = totalAreaSum.plus(region.totalArea);
                chargedTotalAreaSum = chargedTotalAreaSum.plus(bn(region.value).times(region.totalArea));
            });

            vm.weightedAverageChargedByTotalArea = bn(chargedTotalAreaSum).div(totalAreaSum).round(2).toNumber();
        }

        function contributionSizeRange(average) {
            var ranges = [
                {
                    begin: 0,
                    end: bn(average).times(0.8).round(2).toNumber(),
                    color: MAP_COLORS.GREEN_COLOR
                },
                {
                    begin: bn(average).times(0.8).round(2).toNumber(),
                    end: average,
                    color: MAP_COLORS.YELLOW_COLOR
                },
                {
                    begin: average,
                    end: bn(average).times(1.2).round(2).toNumber(),
                    color: MAP_COLORS.ORANGE_COLOR
                },
                {
                    begin: bn(average).times(1.2).round(2).toNumber(),
                    color: MAP_COLORS.RED_COLOR
                }
            ];

            return {
                list: rangeList,
                color: rangeColor
            };

            function rangeList() {
                return ranges;
            }

            function rangeColor(value) {
                var color = MAP_COLORS.GREY_COLOR;

                for (var i = ranges.length - 1, range; i > -1; i--) {
                    range = ranges[i];
                    if ((value >= range.begin && value <= range.end) ||
                        (value >= range.begin && range.end === undefined)) {

                        color = range.color;
                        break;
                    }
                }

                return color;
            }
        }

        function getDisplayRanges(ranges) {
            var displayRanges = [], units = 'руб.\u2044кв.м.'; // 'FRACTION SLASH' (U+2044)

            ranges.forEach(function (range, index, ranges) {
                displayRanges.push({
                    style: publicStatisticRangeIcon(range.color),
                    name: currencyFilter(range.begin, '') + (index < ranges.length - 1 ?
                        ' - ' + currencyFilter(range.end, '') + ' ' + units :
                        ' ' + units + ' и более')
                });

                if (index === 1) {
                    displayRanges.push({name: currencyFilter(range.end, '') + ' ' + units});
                }
            });

            displayRanges.push({
                style: publicStatisticRangeIcon(MAP_COLORS.GREY_COLOR),
                name: 'Нет данных'
            });

            return displayRanges;
        }

        function regionValueAvailable() {
            return Boolean(vm.region && (vm.region.value || vm.region.value === 0));
        }

        function percentAvailable() {
            return Boolean(vm.region && (vm.region.percent || vm.region.percent === 0));
        }
    }
})(angular);

(function (angular) {'use strict';
    wdgtContributionSize2Rest.$inject = ["publicStatisticWidgetRestResource"];
    angular.module('pafo-common-web-package')
        .factory('publicStatisticWdgtContributionSize2Rest', wdgtContributionSize2Rest);

    /* @ngInject */
    function wdgtContributionSize2Rest(publicStatisticWidgetRestResource) {
        var widget = createRestResources();

        return {
            options: widget.contributionTariffOptions.get,
            data: widget.contributionTariffData.get
        };

        function createRestResources() {
            return {
                contributionTariffOptions: publicStatisticWidgetRestResource('/contribution-tariff/options'),
                contributionTariffData: publicStatisticWidgetRestResource('/contribution-tariff/data' +
                    '?month=:month&year=:year')
            };
        }
    }
})(angular);
(function (angular) {'use strict';
    WdgtContributionSizeCtrl.$inject = ["$state", "publicStatisticWdgtContributionSizeRest", "publicStatisticError", "MapData", "publicStatisticRange"];
    angular.module('pafo-common-web-package')
        .controller('publicStatisticWdgtContributionSizeCtrl', WdgtContributionSizeCtrl);

    /* @ngInject */
    function WdgtContributionSizeCtrl($state, publicStatisticWdgtContributionSizeRest,
                                                publicStatisticError, MapData, publicStatisticRange) {
        var vm = this;

        vm.pageTitle = $state.current.data.pageTitle;
        vm.breadcrumbs = $state.current.data.breadcrumbs;

        vm.search = search;

        vm.filterChanged = filterChanged;
        vm.wdgtContributionSizeSrcType = {
            TARIFF_OWN: {
                code: 'TARIFF_OWN'
            },
            TARIFF_GOV: {
                code: 'TARIFF_GOV'
            }
        };
        vm.selectedSrcType = vm.wdgtContributionSizeSrcType.TARIFF_GOV.code;

        vm.munResourceSelectAvailable = munResourceSelectAvailable;
        vm.munDirectionSelectAvailable = munDirectionSelectAvailable;
        vm.munUnitSelectAvailable = munUnitSelectAvailable;

        vm.setRegion = function (region) {vm.region = region;};

        publicStatisticWdgtContributionSizeRest.contributionSizeData()
            .then(search, publicStatisticError);

        function search() {
            return publicStatisticWdgtContributionSizeRest.contributionSizeData()
                .then(displayMap, publicStatisticError);
        }

        function displayMap(data) {
            var regions = angular.copy(MapData),

                regionsByCode = regions.reduce(function(map, region) {
                    map[region.id] = region;
                    return map;
                }, {}),

                range = publicStatisticRange(
                    data.regionData,
                    vm.selectedSrcType === vm.wdgtContributionSizeSrcType.TARIFF_GOV.code ? 'tariffGov' : 'tariffOwn');

            vm.date = Date.now();//TODO: Данные по состоянию на

            vm.contributionSizeData = data;

            vm.ranges = range.list();

            data.regionData.forEach(function (data) {
                var region = regionsByCode[data.regionCode];
                if (region) {
                    region.tariffGov = data.tariffGov;
                    region.tariffOwn = data.tariffOwn;
                    region.value = vm.selectedSrcType === vm.wdgtContributionSizeSrcType.TARIFF_GOV.code ? data.tariffGov : data.tariffOwn;
                    if (data.tariffOwn && data.tariffGov) {
                        region.ratio = (data.tariffOwn / data.tariffGov).toFixed(2);
                    } else {
                        region.ratio = 0;
                    }
                    if(region.value !== 0) {
                        region.fill = range.color(region.value);
                    }
                }
            });

            vm.regions = regions;
        }

        function filterChanged(srcType) {
            vm.selectedSrcType = srcType;
            displayMap(vm.contributionSizeData);
        }

        function munResourceSelectAvailable() {
            return vm.munResourceCodes && vm.munResourceCodes.length > 1;
        }

        function munDirectionSelectAvailable() {
            return vm.munDirections && vm.munDirections.length > 0;
        }

        function munUnitSelectAvailable() {
            return vm.munUnits && vm.munUnits.length > 0;
        }
    }
})(angular);
(function (angular) {'use strict';
    wdgtContributionSizeRest.$inject = ["publicStatisticWidgetRestResource"];
    angular.module('pafo-common-web-package')
        .factory('publicStatisticWdgtContributionSizeRest', wdgtContributionSizeRest);

    /* @ngInject */
    function wdgtContributionSizeRest(publicStatisticWidgetRestResource) {
        var widget = createRestResources();

        return {
            contributionSizeData: widget.contributionSizeData.get
        };

        function contributionSizeData() {
            return widget.contributionSizeData.get;
        }

        function createRestResources() {
            return {
                contributionSizeData: publicStatisticWidgetRestResource('/contribution-sizes/data')
            };
        }
    }
})(angular);

(function (angular) {'use strict';
    wdgtMkdControlMethodRest.$inject = ["publicStatisticWidgetRestResource"];
    angular.module('pafo-common-web-package')
        .factory('publicStatisticWdgtMkdControlMethodRest', wdgtMkdControlMethodRest);

    /* @ngInject */
    function wdgtMkdControlMethodRest(publicStatisticWidgetRestResource) {
        var widget = createRestResources();

        return {
            data: widget.mkdControlMethodData.get
        };

        function createRestResources() {
            return {
                mkdControlMethodData: publicStatisticWidgetRestResource('/mkd-control-method/data')
            };
        }
    }
})(angular);
(function (angular) {'use strict';
    angular.module('pafo-common-web-package')
        .factory('publicStatisticWdgtMkdControlMethodSorting', wdgtMkdControlMethodSorting);

    /* @ngInject */
    function wdgtMkdControlMethodSorting() {
        var columns = {
            name: 'name',

            totalFactMkd: 'totalFactMkd',
            mainValue: 'mainValue',
            totalPlanMkd: 'totalPlanMkd',

            factDirectControl: 'factDirectControl',
            factDirectControlPercent: 'factDirectControlPercent',
            planDirectControl: 'planDirectControl',

            factManagementOrganization: 'factManagementOrganization',
            factManagementOrganizationPercent: 'factManagementOrganizationPercent',
            planManagementOrganization: 'planManagementOrganization',

            factCooperativeType: 'factCooperativeType',
            factCooperativeTypePercent: 'factCooperativeTypePercent',
            planCooperativeType: 'planCooperativeType',

            factControlMethod: 'factControlMethod',
            factControlMethodPercent: 'factControlMethodPercent',
            planControlMethod: 'planControlMethod',

            unpublishedControlMethod: 'unpublishedControlMethod'
        };

        return function () {
            var data,
                params,
                columnA,
                columnB,
                columnC,
                isReverse = true;

            return {
                columns: columns,
                setData: setData,
                sort: sort,
                getClass: getClass
            };

            function setData(sortingData) {
                data = sortingData;
            }

            // Сортировка в пределах группы столбцов одного способа управления со следующим приоритетом
            // %, Факт, Алфавитный порядок регионов
            // В качестве параметров приходят столбцы, по которым нужно сортировать.
            // Для всех добавляется сортировка по региону(если это не она и есть)
            function sort(sortingColumnA, sortingColumnB, sortingColumnC, dontReverse) {
                if (!data) {
                    return;
                }

                columnA = sortingColumnA;
                columnB = sortingColumnB;
                columnC = sortingColumnC;

                if (!dontReverse) {
                    isReverse = !isReverse;
                }

                if (columnA === columns.name) {
                    data.sort(reversibleNameComparator);
                    return;
                }

                data.sort(reversibleComparator);
            }

            function getClass(sortingColumn) {
                return columnA === sortingColumn ? (isReverse ? 'desc': 'asc') : null;
            }

            function reverse(val) {
                return isReverse ? val * -1 : val;
            }

            function isEmpty(val) {
                return val === undefined || val === null;
            }

            function reversibleComparator(val1, val2) {
                var a1 = val1[columnA],
                    a2 = val2[columnA];
                var b1 = val1[columnB],
                    b2 = val2[columnB];
                var c1 = val1[columnC],
                    c2 = val2[columnC];
                return reverse(compare(a1, a2) || compare(b1, b2) ||
                    compare(c1, c2) || nameCompare(val1, val2));
            }

            function compare (o1, o2) {
                if (o1 === o2) {
                    return 0;
                }

                if (!isEmpty(o1) && isEmpty(o2)) {
                    return 1;
                }

                if (isEmpty(o1) && !isEmpty(o2)) {
                    return -1;
                }

                return o1 - o2;
            }


            function reversibleNameComparator(val1, val2) {
                return reverse(nameCompare(val1, val2));
            }

            function nameCompare(val1, val2) {
                if (val1.name === val2.name) {
                    return 0;
                }

                return val1.name < val2.name ? -1 : 1;
            }

        };
    }
})(angular);
(function (angular) {'use strict';
PublicStatisticWdgtMkdControlMethodCtrl.$inject = ["$state", "publicStatisticWdgtMkdControlMethodRest", "publicStatisticError", "MapData", "STAT_WIDG_HOUSE_MANAGEMENTS", "MAP_COLORS", "publicStatisticRangeIcon", "publicStatisticNumeralCoherentText", "publicStatisticWdgtMkdControlMethodSorting"];
    angular.module('pafo-common-web-package')
        .controller('publicStatisticWdgtMkdControlMethodCtrl', PublicStatisticWdgtMkdControlMethodCtrl);

    /* @ngInject */
    function PublicStatisticWdgtMkdControlMethodCtrl($state, publicStatisticWdgtMkdControlMethodRest,
                                                     publicStatisticError, MapData, STAT_WIDG_HOUSE_MANAGEMENTS,
                                                     MAP_COLORS, publicStatisticRangeIcon,
                                                     publicStatisticNumeralCoherentText,
                                                     publicStatisticWdgtMkdControlMethodSorting) {
        var vm = this,
            range = mkdControlMethodRange(),
            regionData = [],
            PRECISION = 4; // расчетные значения округляются до 4 знаков после запятой

        vm.pageTitle = $state.current.data.pageTitle;
        vm.breadcrumbs = $state.current.data.breadcrumbs;
        vm.numeralCoherentText = publicStatisticNumeralCoherentText;

        vm.totalStats = {};

        vm.mapData = angular.copy(MapData); // map model
        vm.setRegion = function (region) {vm.region = region;};

        vm.managementMethods = STAT_WIDG_HOUSE_MANAGEMENTS;
        vm.getManagementMethodsStatus = getManagementMethodsStatus;
        vm.selectedManagementMethods = angular.copy(vm.managementMethods);
        vm.selectManagementMethods = selectManagementMethods;

        vm.showPlan = true;
        vm.showFact = true;
        vm.showPercent = true;

        vm.countValueKinds = countValueKinds;
        vm.valueKindDisabled = valueKindDisabled;
        vm.onlyByUnknown = onlyByUnknown;

        vm.tableData = {}; // table model
        vm.regionTotal = {};
        vm.getRangeIcon = getRangeIcon;

        vm.sorting = publicStatisticWdgtMkdControlMethodSorting();

        publicStatisticWdgtMkdControlMethodRest.data()
            .then(setRegionData, publicStatisticError);


        function setRegionData(data) {
            regionData = data.regionData;
            vm.date = data.dataReloadTime;
            selectManagementMethods();
        }

        function mkdControlMethodRange() {
            var ranges = [
                {beginPrefix: 'с', begin: 0.7501, color: MAP_COLORS.GREEN_COLOR},
                {begin: 0.5001, endPrefix: '\u2013', end: 0.75, color: MAP_COLORS.YELLOW_COLOR},
                {begin: 0.2501, endPrefix: '\u2013', end: 0.50, color: MAP_COLORS.ORANGE_COLOR},
                {endPrefix: 'по', end: 0.25, color: MAP_COLORS.RED_COLOR}
            ];

            return {
                list: rangeList,
                color: rangeColor
            };

            function rangeList() {
                return ranges;
            }

            function rangeColor(value) {
                return ranges.filter(function(range) {
                    return (range.begin === undefined || value >= range.begin) &&
                        (range.end === undefined || value <= range.end);
                })[0].color;
            }
        }

        function countValueKinds() {
            var count = 0;
            if (vm.showPlan) {count++;}
            if (vm.showFact) {count++;}
            if (vm.showPercent) {count++;}
            return count;
        }

        function onlyByUnknown() {
            return vm.inTermsOfManagementMethods === 1 && vm.showByUnknown;
        }

        function valueKindDisabled(showValueKind) {
            return (showValueKind && vm.countValueKinds() === 1) || onlyByUnknown();
        }

        function getManagementMethodsStatus () {
            if (vm.selectedManagementMethods.length === 0) {
                return 'Выберите способ управления';
            }

            if (vm.selectedManagementMethods.length === vm.managementMethods.length) {
                return 'Все способы управления';
            }

            if (vm.selectedManagementMethods.length > 1){
                return 'Выбранные способы управления';
            }

            return vm.selectedManagementMethods[0].name;
        }

        function selectManagementMethods() {
            vm.showByDirectControl = false;
            vm.showByManagementOrganization = false;
            vm.showByManagementCooperative = false;
            vm.showByAnotherWay = false;
            vm.showByUnknown = false;

            vm.inTermsOfManagementMethods = vm.selectedManagementMethods.length;

            Object.keys(vm.selectedManagementMethods)
                .forEach(function (key) {
                    if (vm.selectedManagementMethods[key].id === 1) {
                        vm.showByDirectControl = true;
                    }
                    if (vm.selectedManagementMethods[key].id === 2) {
                        vm.showByManagementOrganization = true;
                    }
                    if (vm.selectedManagementMethods[key].id === 3) {
                        vm.showByManagementCooperative = true;
                    }
                    if (vm.selectedManagementMethods[key].id === 4) {
                        vm.showByAnotherWay = true;
                    }
                    if (vm.selectedManagementMethods[key].id === 5) {
                        vm.showByUnknown = true;
                    }
                });



            if (onlyByUnknown()) {
            // Выбрано - Информация о способе управления не размещена в системе
                vm.showPlan = true;
                vm.showFact = true;
                vm.showPercent = true;
            }

            vm.ranges = range.list();

            fillMap();

            fillTable();

            vm.totalStats = getTotalStatsByRegionStats();
            calculateAndFillForRussia(vm.regionTotal, vm.totalStats);

            vm.sorting.setData(vm.tableData);
            // Первоначально таблица отсортирована по имени региона
            vm.sorting.sort(vm.sorting.columns.name, undefined, undefined, true);
        }

        // function getTotalStats(){
        //     var total = {
        //             factDirectControl: 0,
        //             factManagementOrganization: 0,
        //             factCooperativeType: 0,
        //             factControlMethod: 0,
        //             unpublishedControlMethod: 0,
        //
        //             planDirectControl: 0,
        //             planManagementOrganization: 0,
        //             planCooperativeType: 0,
        //             planControlMethod: 0
        //         },
        //         factTotalMkd,
        //         planTotalMkd;
        //
        //     regionData.forEach(function(region){
        //         total.factDirectControl += region.factDirectControl;
        //         total.factManagementOrganization += region.factManagementOrganization;
        //         total.factCooperativeType += region.factCooperativeType;
        //         total.factControlMethod += region.factControlMethod;
        //         total.unpublishedControlMethod += region.unpublishedControlMethod;
        //
        //         total.planDirectControl += region.planDirectControl;
        //         total.planManagementOrganization += region.planManagementOrganization;
        //         total.planCooperativeType += region.planCooperativeType;
        //         total.planControlMethod += region.planControlMethod;
        //     });
        //
        //     factTotalMkd = total.factDirectControl + total.factManagementOrganization +
        //         total.factCooperativeType + total.factControlMethod;
        //     if (vm.showByUnknown) {
        //         factTotalMkd += total.unpublishedControlMethod;
        //     }
        //     planTotalMkd =  total.planDirectControl + total.planManagementOrganization +
        //         total.planCooperativeType + total.planControlMethod;
        //
        //     total.totalFactMkd = factTotalMkd;
        //     total.totalPlanMkd = planToFact(planTotalMkd, factTotalMkd);
        //     if (total.totalPlanMkd){
        //         total.totalMkdFactPercent = Number((factTotalMkd / total.totalPlanMkd).toFixed(PRECISION));
        //     }
        //
        //     total.directControl = total.factDirectControl;
        //     total.managementOrganization = total.factManagementOrganization;
        //     total.cooperativeType = total.factCooperativeType;
        //     total.controlMethod = total.factControlMethod;
        //
        //     return total;
        // }

        function getTotalStatsByRegionStats(){
            var total = {
                    factDirectControl: 0,
                    factManagementOrganization: 0,
                    factCooperativeType: 0,
                    factControlMethod: 0,
                    unpublishedControlMethod: 0,

                    planDirectControl: 0,
                    planManagementOrganization: 0,
                    planCooperativeType: 0,
                    planControlMethod: 0
                },
                factTotalMkd,
                planTotalMkd = 0;

            vm.tableData.forEach(function(region){
                planTotalMkd += region.totalPlanMkd;

                total.factDirectControl += region.factDirectControl;
                total.factManagementOrganization += region.factManagementOrganization;
                total.factCooperativeType += region.factCooperativeType;
                total.factControlMethod += region.factControlMethod;
                total.unpublishedControlMethod += region.unpublishedControlMethod;

                total.planDirectControl += region.planDirectControl;
                total.planManagementOrganization += region.planManagementOrganization;
                total.planCooperativeType += region.planCooperativeType;
                total.planControlMethod += region.planControlMethod;
            });

            factTotalMkd = (total.factDirectControl ? total.factDirectControl : 0) +
                (total.factManagementOrganization ? total.factManagementOrganization : 0) +
                (total.factCooperativeType ? total.factCooperativeType : 0) +
                (total.factControlMethod ? total.factControlMethod : 0);
            if (vm.showByUnknown) {
                factTotalMkd += total.unpublishedControlMethod ? total.unpublishedControlMethod : 0;
            }
            // planTotalMkd =  total.planDirectControl + total.planManagementOrganization +
            //     total.planCooperativeType + total.planControlMethod;

            total.totalFactMkd = factTotalMkd;
            total.totalPlanMkd = planTotalMkd;
            if (total.totalPlanMkd){
                total.totalMkdFactPercent = Number((total.totalFactMkd / total.totalPlanMkd).toFixed(PRECISION));
            }

            total.directControl = total.factDirectControl;
            total.managementOrganization = total.factManagementOrganization;
            total.cooperativeType = total.factCooperativeType;
            total.controlMethod = total.factControlMethod;

            return total;
        }

        function fillMap() {
            var tmpMap = angular.copy(MapData);

            angular.forEach(tmpMap, function (region) {
                regionData.forEach(function (regionStats) {
                    if (region.id === regionStats.regionCode) {
                        calculateAndFillForRegion(region, regionStats);
                    }
                });
            });

            tmpMap.forEach(function (region) {
                region.fill = getRangeColor(region);
            });

            vm.mapData = tmpMap;
        }

        function getRangeColor(regionInfo) {
            if (vm.inTermsOfManagementMethods === 0) {
                return MAP_COLORS.GRAY_COLOR;
            }

            if (onlyByUnknown()) {
                if (regionInfo.totalFactMkd) {
                    return MAP_COLORS.BLUE_COLOR;
                }

                return MAP_COLORS.GRAY_COLOR;
            }

            if (regionInfo.totalPlanMkd === 0 && regionInfo.totalFactMkd !== 0) {
                return MAP_COLORS.BLUE_COLOR;
            }

            if (regionInfo.mainValue === undefined) {
                return MAP_COLORS.GRAY_COLOR;
            }

            return range.color(regionInfo.mainValue);
        }

        function fillTable() {
            var tmpMap = angular.copy(MapData);

            angular.forEach(tmpMap, function (region) {
                regionData.forEach(function (regionStats) {
                    if (region.id === regionStats.regionCode) {
                        calculateAndFillForRegion(region, regionStats);
                    }
                });
            });

            //Количество строк в таблице не уменьшается - соответствует количеству строк в витрине.
            vm.tableData = tmpMap.filter(function(entry){
                return entry.totalPlanMkd !== undefined && entry.totalFactMkd !== undefined;
            });
        }

        function getRangeIcon(regionInfo) {
            return publicStatisticRangeIcon(getRangeColor(regionInfo));
        }

        function calculateAndFillForRussia(region, regionStats) {
            if (vm.inTermsOfManagementMethods === 0) {
                region.totalFactMkd = 0;
                region.totalPlanMkd = 0;
                region.mainValue = null;
                return;
            }

            if (onlyByUnknown()) {
                region.unpublishedControlMethod = regionStats.unpublishedControlMethod;
                region.totalFactMkd = regionStats.unpublishedControlMethod;
                region.totalPlanMkd = 0;
                region.mainValue = null;
                return;
            }

            //Непосредственное управление
            if (vm.showByDirectControl) {
                region.factDirectControl = regionStats.factDirectControl;
                region.planDirectControl = regionStats.planDirectControl;
                if (region.planDirectControl){
                    region.factDirectControlPercent = Number((region.factDirectControl / region.planDirectControl).toFixed(PRECISION));
                }
            }
            //Управляющая организация
            if (vm.showByManagementOrganization) {
                region.factManagementOrganization = regionStats.factManagementOrganization;
                region.planManagementOrganization = regionStats.planManagementOrganization;
                if (region.planManagementOrganization){
                    region.factManagementOrganizationPercent =
                        Number((region.factManagementOrganization / region.planManagementOrganization).toFixed(PRECISION));
                }
            }
            //ТСЖ, ЖСК, ЖК иной кооператив
            if (vm.showByManagementCooperative) {
                region.factCooperativeType = regionStats.factCooperativeType;
                region.planCooperativeType = regionStats.planCooperativeType;
                if (region.planCooperativeType){
                    region.factCooperativeTypePercent = Number((region.factCooperativeType / region.planCooperativeType).toFixed(PRECISION));
                }
            }
            // Способ управления не выбран или не реализован
            if (vm.showByAnotherWay) {
                region.factControlMethod = regionStats.factControlMethod;
                region.planControlMethod = regionStats.planControlMethod;
                if (region.planControlMethod){
                    region.factControlMethodPercent = Number((region.factControlMethod / region.planControlMethod).toFixed(PRECISION));
                }
            }
            //Информация о способе управления не размещена в системе
            if (vm.showByUnknown) {
                region.unpublishedControlMethod = regionStats.unpublishedControlMethod;
            }

            region.totalFactMkd = regionStats.totalFactMkd;
            region.totalPlanMkd =  regionStats.totalPlanMkd;

            if (region.totalPlanMkd){
                region.mainValue = Number((region.totalFactMkd / region.totalPlanMkd).toFixed(PRECISION));
            }
        }


        function calculateAndFillForRegion(region, regionStats) {
            var totalFactMkd = 0,
                totalPlanMkd = 0;

            if (vm.inTermsOfManagementMethods === 0) {
                region.totalFactMkd = 0;
                region.totalPlanMkd = 0;
                region.mainValue = null;
                return;
            }

            if (onlyByUnknown()) {
                region.unpublishedControlMethod = regionStats.unpublishedControlMethod;
                region.totalFactMkd = regionStats.unpublishedControlMethod;
                region.totalPlanMkd = 0;
                region.mainValue = null;
                return;
            }

            //Непосредственное управление
            if (vm.showByDirectControl) {
                region.factDirectControl = regionStats.factDirectControl;
                totalFactMkd += regionStats.factDirectControl;
                totalPlanMkd += regionStats.planDirectControl;

                region.planDirectControl = regionStats.planDirectControl;
                if (region.planDirectControl){
                    region.factDirectControlPercent = Number((region.factDirectControl / region.planDirectControl).toFixed(PRECISION));
                }
            }
            //Управляющая организация
            if (vm.showByManagementOrganization) {
                region.factManagementOrganization = regionStats.factManagementOrganization;

                totalFactMkd += regionStats.factManagementOrganization;
                totalPlanMkd += regionStats.planManagementOrganization;

                region.planManagementOrganization = regionStats.planManagementOrganization;
                if (region.planManagementOrganization){
                    region.factManagementOrganizationPercent =
                        Number((region.factManagementOrganization / region.planManagementOrganization).toFixed(PRECISION));
                }
            }
            //ТСЖ, ЖСК, ЖК иной кооператив
            if (vm.showByManagementCooperative) {
                region.factCooperativeType = regionStats.factCooperativeType;

                totalFactMkd += regionStats.factCooperativeType;
                totalPlanMkd += regionStats.planCooperativeType;

                region.planCooperativeType = regionStats.planCooperativeType;
                if (region.planCooperativeType){
                    region.factCooperativeTypePercent = Number((region.factCooperativeType / region.planCooperativeType).toFixed(PRECISION));
                }
            }
            // Способ управления не выбран или не реализован
            if (vm.showByAnotherWay) {
                region.factControlMethod = regionStats.factControlMethod;

                totalFactMkd += regionStats.factControlMethod;
                totalPlanMkd += regionStats.planControlMethod;

                region.planControlMethod = regionStats.planControlMethod;
                if (region.planControlMethod){
                    region.factControlMethodPercent = Number((region.factControlMethod / region.planControlMethod).toFixed(PRECISION));
                }
            }
            //Информация о способе управления не размещена в системе
            if (vm.showByUnknown) {
                region.unpublishedControlMethod = regionStats.unpublishedControlMethod;
                totalFactMkd += regionStats.unpublishedControlMethod;
            }

            region.totalFactMkd = totalFactMkd;
            region.totalPlanMkd =  planToFact(totalPlanMkd, totalFactMkd);

            if (region.totalPlanMkd){
                region.mainValue = Number((totalFactMkd / region.totalPlanMkd).toFixed(PRECISION));
            }
        }



function planToFact(plan, fact) {
    // if (plan === 0){
    //     return 0;
    // }
    return plan < fact ? fact : plan;
}
}
})(angular);

(function (angular) {'use strict';
    PublicStatisticWdgtMunicipalServicesChargeCtrl.$inject = ["$state", "publicStatisticWdgtMunicipalServicesChargeRest", "publicStatisticError", "MapData", "publicStatisticRange", "publicStatisticMonthYears", "$log"];
    angular.module('pafo-common-web-package')
        .controller('publicStatisticWdgtMunicipalServicesChargeCtrl', PublicStatisticWdgtMunicipalServicesChargeCtrl);

    /* @ngInject */
    function PublicStatisticWdgtMunicipalServicesChargeCtrl($state, publicStatisticWdgtMunicipalServicesChargeRest,
                                                            publicStatisticError, MapData, publicStatisticRange,
                                                            publicStatisticMonthYears, $log) {
        var vm = this, monthYears;

        vm.pageTitle = $state.current.data.pageTitle;
        vm.breadcrumbs = $state.current.data.breadcrumbs;

        vm.search = search;

        vm.munServiceSelectAvailable = munServiceSelectAvailable;

        vm.setRegion = function (region) {vm.region = region;};

        vm.getOktmoCharges = getOktmoCharges;
        vm.oktmoChargesAvailable = oktmoChargesAvailable;


        publicStatisticWdgtMunicipalServicesChargeRest.options()
            .then(setOptionsAndSearch, publicStatisticError);


        function setOptionsAndSearch(options) {
            if (!options.length) {
                $log.debug('No options');
                return;
            }

            monthYears = publicStatisticMonthYears(options);

            vm.monthYears = monthYears.list();

            vm.searchParams = {monthYear: vm.monthYears[0]};

            searchByMonthYearAndService();
        }

        function searchByMonthYearAndService(munService) {
            var searchParams = angular.copy(monthYears.pair(vm.searchParams.monthYear));

            searchParams.munServiceId = munService !== undefined ? munService : '';

            return publicStatisticWdgtMunicipalServicesChargeRest.data(searchParams)
                .then(displayMap, publicStatisticError);
        }

        function displayMap(data) {
            var regions = angular.copy(MapData),

                regionsByCode = regions.reduce(function(map, region) {
                    map[region.id] = region;
                    return map;
                }, {}),

                range = publicStatisticRange(data.territoryData, 'value');

            vm.date = Date.now();//TODO: Данные по состоянию на

            vm.munCharge = data;

            vm.ranges = range.list();

            setAdditionalOptions(data);

            data.territoryData.forEach(function (data) {
                var region = regionsByCode[data.territoryCode];

                region.value = data.value;
                region.documentCount = data.count;
                region.fill = range.color(data.value);
            });

            vm.regions = regions;

            vm.oktmoCharges = null;
        }

        function setAdditionalOptions(data) {
            if (data.serviceOptions) {
                vm.munServiceCodes = data.serviceOptions.map(function (option) {
                    return option.key;
                });
                vm.munServiceNames = data.serviceOptions.reduce(function (map, option) {
                    map[option.key] = option.value;
                    return map;
                }, {});

                vm.searchParams.munService = data.municipalServiceCode;
            }
        }

        function search() {
            searchByMonthYearAndService(vm.searchParams.munService);
        }

        function munServiceSelectAvailable() {
            return vm.munServiceCodes && vm.munServiceCodes.length > 1;
        }

        function getOktmoCharges(region) {
            var monthYearPair = monthYears.pair(vm.searchParams.monthYear),

                searchParams = {
                    month: monthYearPair.month,
                    year: monthYearPair.year,
                    munServiceId: vm.searchParams.munService,
                    regionCode: region.id
                };

            publicStatisticWdgtMunicipalServicesChargeRest.regionData(searchParams)
                .then(setOktmoCharges, publicStatisticError);

            function setOktmoCharges(data) {
                vm.oktmoCharges = data;
            }
        }

        function oktmoChargesAvailable() {
            return Boolean(vm.oktmoCharges && vm.oktmoCharges.territoryData.length);
        }
    }
})(angular);
(function (angular) {'use strict';
    wdgtMunicipalServicesChargeRest.$inject = ["publicStatisticWidgetRestResource"];
    angular.module('pafo-common-web-package')
        .factory('publicStatisticWdgtMunicipalServicesChargeRest', wdgtMunicipalServicesChargeRest);

    /* @ngInject */
    function wdgtMunicipalServicesChargeRest(publicStatisticWidgetRestResource) {
        var widget = createRestResources();

        return {
            options: widget.munServicesChargeOptions.get,
            data: widget.munServicesChargeData.get,
            regionData: widget.munServicesChargeRegionData.get
        };

        function createRestResources() {
            return {
                munServicesChargeOptions: publicStatisticWidgetRestResource('/mun-services-charge/options'),
                munServicesChargeData: publicStatisticWidgetRestResource('/mun-services-charge/data' +
                    '?month=:month&year=:year&munServiceId=:munServiceId'),
                munServicesChargeRegionData: publicStatisticWidgetRestResource('/mun-services-charge/region-data' +
                    '?munServiceId=:munServiceId&month=:month&year=:year&regionCode=:regionCode')
            };
        }
    }
})(angular);
(function (angular) {'use strict';
    PublicStatisticWdgtMunicipalServicesDebtCtrl.$inject = ["$state", "publicStatisticWdgtMunicipalServicesDebtRest", "publicStatisticError", "MapData", "publicStatisticRange", "publicStatisticMonthYears"];
    angular.module('pafo-common-web-package')
        .controller('publicStatisticWdgtMunicipalServicesDebtCtrl', PublicStatisticWdgtMunicipalServicesDebtCtrl);

    /* @ngInject */
    function PublicStatisticWdgtMunicipalServicesDebtCtrl($state, publicStatisticWdgtMunicipalServicesDebtRest,
                                                          publicStatisticError, MapData, publicStatisticRange,
                                                          publicStatisticMonthYears) {
        var vm = this, monthYears;

        vm.note = 'Показатель рассчитан на основании поля "Задолженность за предыдущие периоды" платежных документов, ' +
            'размещенных в системе';

        vm.pageTitle = $state.current.data.pageTitle;
        vm.breadcrumbs = $state.current.data.breadcrumbs;

        vm.search = search;

        vm.setRegion = function (region) {vm.region = region;};
        vm.regionValueAvailable = regionValueAvailable;

        vm.getOktmoDebts = getOktmoDebts;
        vm.oktmoDebtsAvailable = oktmoDebtsAvailable;


        publicStatisticWdgtMunicipalServicesDebtRest.options()
            .then(setOptionsAndSearch, publicStatisticError);


        function setOptionsAndSearch(options) {
            monthYears = publicStatisticMonthYears(options);

            vm.monthYears = monthYears.list();

            vm.searchParams = {monthYear: vm.monthYears[0]};

            search();
        }

        function search() {
            var monthYearPair = monthYears.pair(vm.searchParams.monthYear),

                searchParams = {
                    month: monthYearPair.month,
                    year: monthYearPair.year
                };

            return publicStatisticWdgtMunicipalServicesDebtRest.data(searchParams)
                .then(displayMap, publicStatisticError);
        }

        function displayMap(data) {
            var regions = angular.copy(MapData),

                regionsByCode = regions.reduce(function(map, region) {
                    map[region.id] = region;
                    return map;
                }, {}),

                range = publicStatisticRange(data.territoryData, 'value');

            vm.date = Date.now();//TODO: Данные по состоянию на

            vm.munDebt = data;

            vm.ranges = range.list();

            data.territoryData.forEach(function (data) {
                var region = regionsByCode[data.territoryCode];

                region.value = data.value;
                region.documentCount = data.count;
                region.fill = range.color(data.value);
            });

            vm.regions = regions;

            vm.oktmoDebts = null;
        }

        function regionValueAvailable() {
            return Boolean(vm.region && (vm.region.value || vm.region.value === 0));
        }

        function getOktmoDebts(region) {
            var monthYearPair = monthYears.pair(vm.searchParams.monthYear),

                searchParams = {
                    month: monthYearPair.month,
                    year: monthYearPair.year,
                    regionCode: region.id
                };

            publicStatisticWdgtMunicipalServicesDebtRest.regionData(searchParams)
                .then(setOktmoDebts, publicStatisticError);

            function setOktmoDebts(data) {
                vm.oktmoDebts = data;
            }
        }

        function oktmoDebtsAvailable() {
            return Boolean(vm.oktmoDebts && vm.oktmoDebts.territoryData.length);
        }
    }
})(angular);
(function (angular) {'use strict';
    wdgtMunicipalServicesDebtRest.$inject = ["publicStatisticWidgetRestResource"];
    angular.module('pafo-common-web-package')
        .factory('publicStatisticWdgtMunicipalServicesDebtRest', wdgtMunicipalServicesDebtRest);

    /* @ngInject */
    function wdgtMunicipalServicesDebtRest(publicStatisticWidgetRestResource) {
        var widget = createRestResources();

        return {
            options: widget.munServicesDebtOptions.get,
            data: widget.munServicesDebtData.get,
            regionData: widget.munServicesDebtRegionData.get
        };

        function createRestResources() {
            return {
                munServicesDebtOptions: publicStatisticWidgetRestResource('/mun-services-debt/options'),
                munServicesDebtData: publicStatisticWidgetRestResource('/mun-services-debt/data' +
                    '?month=:month&year=:year'),
                munServicesDebtRegionData: publicStatisticWidgetRestResource('/mun-services-debt/region-data' +
                    '?month=:month&year=:year&regionCode=:regionCode')
            };
        }
    }
})(angular);
(function (angular) {'use strict';
    WdgtMunicipalServicesNormativeCtrl.$inject = ["$state", "publicStatisticWdgtMunicipalServicesNormativeRest", "publicStatisticError", "MapData", "MAP_COLORS", "intanBigNumber", "publicStatisticQuarterYears", "publicStatisticRangeIcon", "$filter", "$log"];
    angular.module('pafo-common-web-package')
        .controller('publicStatisticWdgtMunicipalServicesNormativeCtrl', WdgtMunicipalServicesNormativeCtrl);

    /* @ngInject */
    function WdgtMunicipalServicesNormativeCtrl($state, publicStatisticWdgtMunicipalServicesNormativeRest,
                                                publicStatisticError, MapData, MAP_COLORS, intanBigNumber,
                                                publicStatisticQuarterYears, publicStatisticRangeIcon, $filter, $log) {
        var vm = this,
            quarterYears,
            bn = intanBigNumber,
            numFilter = $filter('number');

        vm.pageTitle = $state.current.data.pageTitle;
        vm.breadcrumbs = $state.current.data.breadcrumbs;

        vm.quarterYearChange = quarterYearChange;
        vm.munServiceChange = munServiceChange;
        vm.munResourceChange = munResourceChange;
        vm.munDirectionChange = munDirectionChange;
        vm.munUnitChange = munUnitChange;

        vm.munServiceSelectAvailable = munServiceSelectAvailable;
        vm.munResourceSelectAvailable = munResourceSelectAvailable;
        vm.munDirectionSelectAvailable = munDirectionSelectAvailable;
        vm.munUnitSelectAvailable = munUnitSelectAvailable;

        vm.setRegion = function (region) {vm.region = region;};

        publicStatisticWdgtMunicipalServicesNormativeRest.munServicesNormativeOptions()
            .then(setOptionsAndSearch, publicStatisticError);


        function setOptionsAndSearch(options) {
            if(!options.length){
                $log.debug('No options');
                return;
            }

            // options fix: квартал приходит в поле month
            options = options.map(function(pair) {return {quarter: pair.month, year: pair.year};});

            quarterYears = publicStatisticQuarterYears(options);
            vm.quarterYears = quarterYears.list();
            vm.searchParams = {quarterYear: vm.quarterYears[0]};

            search(searchParams());
        }

        function search(searchParams) {
            return publicStatisticWdgtMunicipalServicesNormativeRest.munServicesNormativeData(searchParams)
                .then(displayMap, publicStatisticError);
        }

        function displayMap(data) {
            var regions = angular.copy(MapData),

                regionsByCode = regions.reduce(function(map, region) {
                    map[region.id] = region;
                    return map;
                }, {}),

                range;

            vm.date = Date.now();//TODO: Данные по состоянию на

            vm.munService = data;

            range = normativeRange(vm.munService.average);

            vm.ranges = getDisplayRanges(range.list(), vm.munService.measuringUnits);

            setAdditionalOptions(data);

            data.territoryData.forEach(function (data) {
                var region = regionsByCode[data.territoryCode];

                region.value = data.value;
                region.fill = range.color(data.value);
            });

            vm.regions = regions;
        }

        function normativeRange(average) {
            var ranges = [
                {
                    begin: 0,
                    end: bn(average).times(0.8).round(2).toNumber(),
                    color: MAP_COLORS.GREEN_COLOR
                },
                {
                    begin: bn(average).times(0.8).round(2).toNumber(),
                    end: average,
                    color: MAP_COLORS.YELLOW_COLOR
                },
                {
                    begin: average,
                    end: bn(average).times(1.2).round(2).toNumber(),
                    color: MAP_COLORS.ORANGE_COLOR
                },
                {
                    begin: bn(average).times(1.2).round(2).toNumber(),
                    color: MAP_COLORS.RED_COLOR
                }
            ];

            return {
                list: rangeList,
                color: rangeColor
            };

            function rangeList() {
                return ranges;
            }

            function rangeColor(value) {
                var color = MAP_COLORS.GREY_COLOR;

                for (var i = ranges.length - 1, range; i > -1; i--) {
                    range = ranges[i];
                    if ((value >= range.begin && value <= range.end) ||
                        (value >= range.begin && range.end === undefined)) {

                        color = range.color;
                        break;
                    }
                }

                return color;
            }
        }

        function getDisplayRanges(ranges, units) {
            var displayRanges = [];

            ranges.forEach(function (range, index, ranges) {
                displayRanges.push({
                    style: publicStatisticRangeIcon(range.color),
                    name: numFilter(range.begin, 2) + (index < ranges.length - 1 ?
                    ' - ' + numFilter(range.end, 2) + ' ' + units :
                    ' ' + units + ' и более')
                });

                if (index === 1) {
                    displayRanges.push({name: numFilter(range.end, 2) + ' ' + units});
                }
            });

            displayRanges.push({
                style: publicStatisticRangeIcon(MAP_COLORS.GREY_COLOR),
                name: 'Нет данных для расчета'
            });

            return displayRanges;
        }

        function setAdditionalOptions(data) {
            if (data.serviceOptions) {
                vm.munServiceCodes = data.serviceOptions.map(function (option) {
                    return option.key;
                });
                vm.munServiceNames = data.serviceOptions.reduce(function (map, option) {
                    map[option.key] = option.value;
                    return map;
                }, {});

                vm.searchParams.munService = data.municipalServiceCode;
            }

            if (data.resourceOptions) {
                vm.munResourceCodes = data.resourceOptions.map(function (option) {return option.key;});
                vm.munResourceNames = data.resourceOptions.reduce(function (map, option) {
                    map[option.key] = option.value;
                    return map;
                }, {});

                vm.searchParams.munResource = data.municipalResourceCode;
            }

            if (data.directionOptions) {
                vm.munDirections = data.directionOptions;
                vm.searchParams.munDirection = data.directionUse;
            }

            if (data.unitsOptions) {
                vm.munUnits = data.unitsOptions;
                vm.searchParams.munUnit = data.measuringUnits;
            }
        }

        function searchParams(additionalParams) {
            var params = angular.copy(quarterYears.pair(vm.searchParams.quarterYear));

            if (additionalParams) {
                angular.extend(params, additionalParams);
            }

            return params;
        }

        function quarterYearChange() {
            search(searchParams());
        }

        function munServiceChange() {
            search(searchParams({
                municipalServiceCode: vm.searchParams.munService
            }));
        }

        function munResourceChange() {
            search(searchParams({
                municipalServiceCode: vm.searchParams.munService,
                municipalResourceCode: vm.searchParams.munResource
            }));
        }

        function munDirectionChange() {
            search(searchParams({
                municipalServiceCode: vm.searchParams.munService,
                municipalResourceCode: vm.searchParams.munResource,
                directionUse: vm.searchParams.munDirection
            }));
        }

        function munUnitChange() {
            search(searchParams({
                municipalServiceCode: vm.searchParams.munService,
                municipalResourceCode: vm.searchParams.munResource,
                directionUse: vm.searchParams.munDirection,
                measuringUnits: vm.searchParams.munUnit
            }));
        }

        function munServiceSelectAvailable() {
            return vm.munServiceCodes && vm.munServiceCodes.length > 1;
        }

        function munResourceSelectAvailable() {
            return vm.munResourceCodes && vm.munResourceCodes.length > 1;
        }

        function munDirectionSelectAvailable() {
            return vm.munDirections && vm.munDirections.length > 1;
        }

        function munUnitSelectAvailable() {
            return vm.munUnits && vm.munUnits.length > 1;
        }
    }
})(angular);

(function (angular) {'use strict';
    wdgtMunicipalServicesNormativeRest.$inject = ["publicStatisticWidgetRestResource"];
    angular.module('pafo-common-web-package')
        .factory('publicStatisticWdgtMunicipalServicesNormativeRest', wdgtMunicipalServicesNormativeRest);

    /* @ngInject */
    function wdgtMunicipalServicesNormativeRest(publicStatisticWidgetRestResource) {
        var widget = createRestResources();

        return {
            munServicesNormativeOptions: widget.munServicesNormativeOptions.get,
            munServicesNormativeData: munServicesNormativeData
        };

        function munServicesNormativeData(data) {
            return widget.munServicesNormativeData.queryPost(null, data);
        }

        function createRestResources() {
            return {
                munServicesNormativeOptions: publicStatisticWidgetRestResource('/mun-services-normative/options'),
                munServicesNormativeData: publicStatisticWidgetRestResource('/mun-services-normative/data')
            };
        }
    }
})(angular);

(function (angular) {'use strict';
    PublicStatisticWdgtMunicipalServicesPaymentCtrl.$inject = ["$state", "publicStatisticWdgtMunicipalServicesPaymentRest", "publicStatisticError", "MapData", "publicStatisticRange", "publicStatisticMonthYears"];
    angular.module('pafo-common-web-package')
        .controller('publicStatisticWdgtMunicipalServicesPaymentCtrl', PublicStatisticWdgtMunicipalServicesPaymentCtrl);

    /* @ngInject */
    function PublicStatisticWdgtMunicipalServicesPaymentCtrl($state, publicStatisticWdgtMunicipalServicesPaymentRest,
                                                             publicStatisticError, MapData, publicStatisticRange,
                                                             publicStatisticMonthYears) {
        var vm = this, monthYears;

        //TODO: год ежегодника
        vm.note = 'Показатель рассчитан на основании данных Российского статистического ежегодника за 2015 г., ' +
            'формируемого Федеральной службой государственной статистики';

        vm.pageTitle = $state.current.data.pageTitle;
        vm.breadcrumbs = $state.current.data.breadcrumbs;

        vm.search = search;

        vm.setRegion = function (region) {vm.region = region;};
        vm.regionValueAvailable = regionValueAvailable;
        vm.paymentPercentAvailable = paymentPercentAvailable;

        vm.getOktmoPayments = getOktmoPayments;
        vm.oktmoPaymentsAvailable = oktmoPaymentsAvailable;


        publicStatisticWdgtMunicipalServicesPaymentRest.options()
            .then(setOptionsAndSearch, publicStatisticError);


        function setOptionsAndSearch(options) {
            monthYears = publicStatisticMonthYears(options);

            vm.monthYears = monthYears.list();

            vm.searchParams = {monthYear: getMonthYear()};

            search();
        }

        function getMonthYear() { //По умолчанию значение равное текущий месяц минус 1 месяц
            var currentDate = new Date(),
                month = currentDate.getMonth(), // 0 соответствует январю,
                year = currentDate.getFullYear(),
                monthYear;

            if (month === 0) {
                month = 12;
                year -= 1;
            }

            monthYear = monthYears.find(month, year);

            if (!monthYear) {
                monthYear =  vm.monthYears[0];
            }

            return monthYear;
        }

        function search() {
            var monthYearPair = monthYears.pair(vm.searchParams.monthYear),

                searchParams = {
                    month: monthYearPair.month,
                    year: monthYearPair.year
                };

            return publicStatisticWdgtMunicipalServicesPaymentRest.data(searchParams)
                .then(displayMap, publicStatisticError);
        }

        function displayMap(data) {
            var regions = angular.copy(MapData),

                regionsByCode = regions.reduce(function(map, region) {
                    map[region.id] = region;
                    return map;
                }, {}),

                range = publicStatisticRange(data.territoryData, 'value');

            vm.date = Date.now();//TODO: Данные по состоянию на

            vm.munPayment = data;

            vm.ranges = range.list();

            data.territoryData.forEach(function (data) {
                var region = regionsByCode[data.territoryCode];

                region.value = data.value;
                region.paymentPercent = data.paymentPercent;
                region.documentCount = data.count;
                region.fill = range.color(data.value);
            });

            vm.regions = regions;

            vm.oktmoPayments = null;
        }

        function regionValueAvailable() {
            return Boolean(vm.region && (vm.region.value || vm.region.value === 0));
        }

        function paymentPercentAvailable() {
            return Boolean(vm.region && (vm.region.paymentPercent || vm.region.paymentPercent === 0));
        }

        function getOktmoPayments(region) {
            var monthYearPair = monthYears.pair(vm.searchParams.monthYear),

                searchParams = {
                    month: monthYearPair.month,
                    year: monthYearPair.year,
                    regionCode: region.id
                };

            publicStatisticWdgtMunicipalServicesPaymentRest.regionData(searchParams)
                .then(setOktmoPayments, publicStatisticError);

            function setOktmoPayments(data) {
                vm.oktmoPayments = data;
            }
        }

        function oktmoPaymentsAvailable() {
            return Boolean(vm.oktmoPayments && vm.oktmoPayments.territoryData.length);
        }
    }
})(angular);

(function (angular) {'use strict';
    wdgtMunicipalServicesPaymentRest.$inject = ["publicStatisticWidgetRestResource"];
    angular.module('pafo-common-web-package')
        .factory('publicStatisticWdgtMunicipalServicesPaymentRest', wdgtMunicipalServicesPaymentRest);

    /* @ngInject */
    function wdgtMunicipalServicesPaymentRest(publicStatisticWidgetRestResource) {
        var widget = createRestResources();

        return {
            options: widget.munServicesPaymentOptions.get,
            data: widget.munServicesPaymentData.get,
            regionData: widget.munServicesPaymentRegionData.get
        };

        function createRestResources() {
            return {
                munServicesPaymentOptions: publicStatisticWidgetRestResource('/mun-services-payment/options'),
                munServicesPaymentData: publicStatisticWidgetRestResource('/mun-services-payment/data' +
                    '?month=:month&year=:year'),
                munServicesPaymentRegionData: publicStatisticWidgetRestResource('/mun-services-payment/region-data' +
                    '?month=:month&year=:year&regionCode=:regionCode')
            };
        }
    }
})(angular);
(function (angular) {'use strict';
    PublicStatisticWdgtMunicipalServicesTariffCtrl.$inject = ["$state", "publicStatisticWdgtMunicipalServicesTariffRest", "publicStatisticError", "MapData", "publicStatisticRange"];
    angular.module('pafo-common-web-package')
        .controller('publicStatisticWdgtMunicipalServicesTariffCtrl', PublicStatisticWdgtMunicipalServicesTariffCtrl);

    /* @ngInject */
    function PublicStatisticWdgtMunicipalServicesTariffCtrl($state, publicStatisticWdgtMunicipalServicesTariffRest,
                                                            publicStatisticError, MapData, publicStatisticRange) {
        var vm = this;

        vm.pageTitle = $state.current.data.pageTitle;
        vm.breadcrumbs = $state.current.data.breadcrumbs;

        vm.search = search;

        vm.setRegion = function (region) {vm.region = region;};

        publicStatisticWdgtMunicipalServicesTariffRest.options()
            .then(setOptionsAndSearch, publicStatisticError);


        function setOptionsAndSearch(options) {
            if (!options.length) {
                return;
            }
            vm.munResourceKeys = options.map(function (option) {return option.key;});

            vm.munResourceNames = options.reduce(function(map, option) {
                map[option.key] = option.value;
                return map;
            }, {});

            vm.searchParams = {munResource: vm.munResourceKeys[0]};

            search();
        }

        function search() {
            var searchParams = {munResourceId: vm.searchParams.munResource};

            return publicStatisticWdgtMunicipalServicesTariffRest.data(searchParams)
                .then(displayMap, publicStatisticError);
        }

        function displayMap(data) {
            var regions = angular.copy(MapData),

                regionsByCode = regions.reduce(function(map, region) {
                    map[region.id] = region;
                    return map;
                }, {}),

                range = publicStatisticRange(data.territoryData, 'value');

            vm.date = Date.now();//TODO: Данные по состоянию на

            vm.munResource = data;

            vm.ranges = range.list();

            data.territoryData.forEach(function (data) {
                var region = regionsByCode[data.territoryCode];

                region.value = data.value;
                region.fill = range.color(data.value);
            });

            vm.regions = regions;
        }
    }
})(angular);
(function (angular) {'use strict';
    wdgtMunicipalServicesTariffRest.$inject = ["publicStatisticWidgetRestResource"];
    angular.module('pafo-common-web-package')
        .factory('publicStatisticWdgtMunicipalServicesTariffRest', wdgtMunicipalServicesTariffRest);

    /* @ngInject */
    function wdgtMunicipalServicesTariffRest(publicStatisticWidgetRestResource) {
        var widget = createRestResources();

        return {
            options: widget.munServicesTariffOptions.get,
            data: widget.munServicesTariffData.get
        };

        function createRestResources() {
            return {
                munServicesTariffOptions: publicStatisticWidgetRestResource('/mun-services-tariff/options'),
                munServicesTariffData: publicStatisticWidgetRestResource('/mun-services-tariff/data' +
                    '?munResourceId=:munResourceId')
            };
        }
    }
})(angular);

(function(angular) {'use strict';
    WorkCostAnalysisCtrl.$inject = ["$state", "intanMoment", "publicStatisticMonthYears", "geoTargetingRegion", "$timeout", "intanAppInfo", "Auth", "SearchResource", "publicStatisticError"];
    angular.module('pafo-common-web-package')
        .controller('PublicStatisticWorkCostAnalysisCtrl', WorkCostAnalysisCtrl);

    /* @ngInject */
    function WorkCostAnalysisCtrl($state, intanMoment, publicStatisticMonthYears, geoTargetingRegion, $timeout,
        intanAppInfo, Auth, SearchResource, publicStatisticError) {

        var vm = this,
            workCostAnalysisRest = rest(),
            ALL_REGIONS = {code: 'RF', name: 'Все субъекты РФ'},
            MAX_SELECTED_REGIONS = 6,
            selectedRegions,
            monthYears = getMonthYears(),
            MAINTENANCE_WORK = {
                code: 'MAINTENANCE_WORK',
                name: 'Обслуживание',
                color: '#01b1a8',
                workCostStatName: 'Общая стоимость обслуживания',
                averageWorkCostStatName: 'Средняя стоимость обслуживания по многоквартирному дому'
            },
            REPAIR_WORK = {
                code: 'REPAIR_WORK',
                name: 'Текущий ремонт',
                color: '#4a68ed',
                workCostStatName: 'Общая стоимость текущего ремонта',
                averageWorkCostStatName: 'Средняя стоимость текущего ремонта по многоквартирному дому'
            },
            EMERGENCY_WORK = {
                code: 'EMERGENCY_WORK',
                name: 'Аварийные работы',
                color: '#ad1d78',
                workCostStatName: 'Общая стоимость аварийных работ',
                averageWorkCostStatName: 'Средняя стоимость аварийных работ по многоквартирному дому'
            },
            regionColors = [
                '#812f24',
                '#ab362f',
                '#db4315',
                '#f3761f',
                '#f9a219',
                '#eed001'
            ],
            workCostStatName = 'Общая стоимость работ',
            averageWorkCostStatName = 'Средняя стоимость работ по многоквартирному дому';

        vm.pageTitle = $state.current.data.pageTitle;
        vm.breadcrumbs = $state.current.data.breadcrumbs;

        vm.regionSelectOptions =  {
            showSelectAllButton: false,
            enableRequiredFieldFeature: true,
            enableMergeSelectedChoice: true,
            data: {text: function(option) {return option.name;}},
            id: function(option) {return option.code;},
            formatResult: function(option) {return option.name;},
            formatSelection: function(option) {return option.name;}
        };
        vm.selectRegions = selectRegions;
        vm.selectPeriod = getData;

        vm.monthYears = monthYears.list();
        vm.selectedMonthYear = vm.monthYears[0];

        vm.workTypes = [MAINTENANCE_WORK, REPAIR_WORK, EMERGENCY_WORK];
        vm.EMERGENCY_WORK = EMERGENCY_WORK;

        vm.specifySector = function (sector) {vm.specifiedSector = sector;};
        vm.resetSpecifiedSector = function () {vm.specifiedSector = null;};

        vm.isSingle = isSingle;

        workCostAnalysisRest.getOptions().then(setOptions, publicStatisticError);


        function isSingle() {
            return selectedRegions.length === 1;
        }

        function isAllRegions() {
            return isSingle() && selectedRegions[0] === ALL_REGIONS;
        }

        function setOptions(data) {
            var authConstraints = Auth.user.organizationRolesWithConstraints;

            if (intanAppInfo.isOrganizationCabinet()) {
                if (authConstraints.some(function (constraint) {return !constraint.regions.length;})) {
                    setRegions(data.regions);
                }
                else {
                    setRegions(data.regions, getAuthConstraintRegionCodes().slice(0, MAX_SELECTED_REGIONS));
                }
                return;
            }

            if (geoTargetingRegion.get()) {
                // Если пользователь заходил через главную страницу, то сервис гео-таргетига уже должен был отработать
                setRegions(data.regions, [geoTargetingRegion.get().regionCode]);
            }
            else {
                // Если пользователь зашел по прямой ссылке, то 5 сек. ожидание сервиса гео-таргетига
                $timeout(function () {
                    setRegions(data.regions, geoTargetingRegion.get() ? [geoTargetingRegion.get().regionCode] : null);
                }, 5000);
            }


            function getAuthConstraintRegionCodes() {
                return authConstraints.map(function (constraint) {
                    return constraint.regions.map(function (region) {return region.businessCode;});
                }).reduce(function(prev, next) {
                    return prev.concat(next);
                }).filter(function (val, i, self) {
                    return self.indexOf(val) === i;
                });
            }
        }

        function setRegions(regions, selectedRegionCodes) {
            regions = Object.keys(regions).map(function (key) {return {code: key, name: regions[key]};})
                .sort(function (region1, region2) {
                    return region1.name === region2.name ? 0 : (region1.name > region2.name ? 1 : -1);
                });

            regions.unshift(ALL_REGIONS);

            vm.regionSelectOptions.data.results = regions;

            if (!selectedRegionCodes || !selectedRegionCodes.length) {
                selectedRegions = [];
            }
            else {
                selectedRegions = regions.filter(function (region) {
                    return selectedRegionCodes.some(function (regionCode) {return region.code === regionCode;});
                });
            }

            if (!selectedRegions.length) {
                selectedRegions.push(ALL_REGIONS);
            }

            vm.selectedRegions = selectedRegions;

            getData();
        }

        function selectRegions() {
            if (!vm.selectedRegions) {
                return;
            }

            if (vm.selectedRegions.length > 1 && vm.selectedRegions.some(equalAllRegions)) {

                if (!selectedRegions.some(equalAllRegions)) {
                    vm.selectedRegions = [ALL_REGIONS];
                }
                else {
                    vm.selectedRegions.splice(vm.selectedRegions.indexOf(ALL_REGIONS), 1);
                }
            }

            if (vm.selectedRegions.length > MAX_SELECTED_REGIONS) {
                vm.selectedRegions.splice(0, 1);
            }

            if (angular.equals(vm.selectedRegions, selectedRegions)) {
                return;
            }

            selectedRegions = vm.selectedRegions;

            getData();

            function equalAllRegions(region) {return region.code === ALL_REGIONS.code;}
        }

        function getMonthYears() {
            var start = intanMoment('2016-07', 'YYYY-MM').startOf('month'),
                end = intanMoment().startOf('month').subtract(1, 'months'),
                monthYears = [];

            while (start.isBefore(end)) {
                monthYears.unshift({
                    month: start.month() + 1,
                    year: start.year()
                });
                start.add(1, 'months');
            }

            return publicStatisticMonthYears(monthYears);
        }

        function getData() {
            var selectedMonthYearPair, params;

            if (!vm.selectedRegions) {
                return;
            }

            selectedMonthYearPair = monthYears.pair(vm.selectedMonthYear);

            params = {
                month: selectedMonthYearPair.month,
                year: selectedMonthYearPair.year
            };

            if (!isAllRegions()) {
                params.regionCodes = vm.selectedRegions.map(function (region) {return region.code;});
            }

            workCostAnalysisRest.getData(params).then(setData, publicStatisticError);
        }

        function setData(data) {
            var chartDataChildren;

            vm.date = data.dataReloadTime;

            vm.resetSpecifiedSector();

            vm.chartTitle = 'ОБЩАЯ СТОИМОСТЬ РАБОТ ЗА ' + monthYears.find(data.month, data.year).toUpperCase();

            vm.data = data;

            if (isSingle()) {
                if (isAllRegions()) {
                    vm.legendTitle = 'ВСЕ СУБЪЕКТЫ РФ';
                    chartDataChildren = getChildren(vm.data.stat.workStats);
                }
                else {
                    if (itemsIsEmpty()) {
                        vm.data = null;
                        return;
                    }
                    vm.legendTitle = vm.data.items[0].regionName.toUpperCase();
                    chartDataChildren = getChildren(vm.data.items[0].stat.workStats);
                }
            }
            else {
                if (itemsIsEmpty()) {
                    vm.data = null;
                    return;
                }
                chartDataChildren = vm.data.items.slice(0, MAX_SELECTED_REGIONS)
                    .sort(function (item1, item2) {
                        return item2.stat.totalStat.workCost - item1.stat.totalStat.workCost;
                    })
                    .map(function (item, i) {
                        return {
                            color: regionColors[i],
                            name: item.regionName,
                            stats: item.stat.totalStat,
                            workCostStatName: workCostStatName,
                            averageWorkCostStatName: averageWorkCostStatName,
                            children: getChildren(item.stat.workStats).map(function (workStat) {
                                workStat.name = item.regionName;
                                return workStat;
                            })
                        };
                    });
            }

            vm.chartData = {children: chartDataChildren};


            function getChildren(workStats) {
                return vm.workTypes.map(function (workType) {
                    var stats = workStats[workType.code];

                    return {
                        color: workType.color,
                        workType: MAINTENANCE_WORK,
                        workCostStatName: workType.workCostStatName,
                        averageWorkCostStatName: workType.averageWorkCostStatName,
                        value: stats.workCost,
                        stats: stats
                    };
                });
            }

            function itemsIsEmpty() {
                return !vm.data.items || !vm.data.items.length;
            }
        }

        function rest() {
            var costWorkWidgetOptions = new SearchResource('/widget/cost-work/options'),
                costWorkWidgetData = new SearchResource('/widget/cost-work/data');

            return {
                getOptions: costWorkWidgetOptions.get,
                getData: function (params) {
                    return costWorkWidgetData.queryPost({}, params);
                }
            };
        }
    }
})(angular);

angular.module('templates-pafo-common', ['houses-condition-2/houses-condition-2.tpl.html', 'houses-condition/houses-condition.tpl.html', 'main-forms/ef-rosstat/ef-rosstat-following-tooltip.tpl.html', 'main-forms/ef-rosstat/ef-rosstat-grants/ef-rosstat-grants.tpl.html', 'main-forms/ef-rosstat/ef-rosstat-housing-stock/ef-rosstat-housing-stock.tpl.html', 'main-forms/ef-rosstat/ef-rosstat-municipal-infrastructure/ef-rosstat-municipal-infrastructure.tpl.html', 'main-forms/map/ef_poch_mapReg_vr.tpl.html', 'main-forms/map/map.tpl.html', 'main-forms/map/statOfWaterQualityMap.tpl.html', 'public-mkd-odpu-2/public-mkd-odpu-2.tpl.html', 'public-mkd-odpu/public-mkd-odpu.tpl.html', 'service-providers-data/components/service-providers-data-table.tpl.html', 'service-providers-data/service-providers-data-tables.tpl.html', 'service-providers-data/service-providers-data.tpl.html', 'shared/intan-territory-select/intan-territory-select.tpl.html', 'shared/intan-year-interval/intan-year-interval.tpl.html', 'shared/rzslider-custom/rzslider-custom.tpl.html', 'wdgt-contribution-size-2/wdgt-contribution-size-2.tpl.html', 'wdgt-contribution-size/wdgt-contribution-size.tpl.html', 'wdgt-mkd-control-method/wdgt-mkd-control-method.tpl.html', 'wdgt-municipal-services-charge/wdgt-municipal-services-charge.tpl.html', 'wdgt-municipal-services-debt/wdgt-municipal-services-debt.tpl.html', 'wdgt-municipal-services-normative/wdgt-municipal-services-normative.tpl.html', 'wdgt-municipal-services-payment/wdgt-municipal-services-payment.tpl.html', 'wdgt-municipal-services-tariff/wdgt-municipal-services-tariff.tpl.html', 'work-cost-analysis/work-cost-analysis.tpl.html']);

angular.module("houses-condition-2/houses-condition-2.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("houses-condition-2/houses-condition-2.tpl.html",
    "<intan-widget-header page-title=\"vm.pageTitle\" breadcrumbs=\"vm.breadcrumbs\"\n" +
    "                     info-date=\"vm.date\"></intan-widget-header>\n" +
    "\n" +
    "<div class=\"form-base _margin-20 _top\">\n" +
    "    <div class=\"form-base__body\">\n" +
    "        <form class=\"form-horizontal\" role=\"form\">\n" +
    "            <div class=\"row form-base__row\">\n" +
    "                <div class=\"col-xs-2\">\n" +
    "                    <label>Отображать на карте:</label>\n" +
    "                </div>\n" +
    "                <div class=\"col-xs-10\">\n" +
    "                    <div class=\"form-group form-base__form-group\">\n" +
    "                        <label>по году ввода дома в эксплуатацию</label>\n" +
    "                    </div>\n" +
    "                    <div class=\"form-group form-base__form-group _padding-15 _right _bottom\">\n" +
    "                      <rzslider\n" +
    "                          rz-slider-tpl-url=\"shared/rzslider-custom/rzslider-custom.tpl.html\"\n" +
    "                          rz-slider-model=\"vm.minYear\"\n" +
    "                          rz-slider-high=\"vm.maxYear\"\n" +
    "                          rz-slider-options=\"vm.dateSliderOptions\">\n" +
    "                      </rzslider>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </form>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-3  margin-right-m-100\">\n" +
    "        <h4 class=\"_padding-20 _top\">Процент износа</h4>\n" +
    "        <div class=\"intan-range\" ng-repeat=\"range in vm.ranges\">\n" +
    "            <div class=\"color intan-disk-30\" ng-style=\"{'background-color': range.color}\"></div>\n" +
    "\n" +
    "            <div class=\"text\" ng-if=\"$first\">\n" +
    "                до {{vm.ranges[$index+1].begin | intanPercent:2}}\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"text\" ng-if=\"$middle\">\n" +
    "                {{range.begin | intanPercent:2:''}} - {{range.end | intanPercent:2}}\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"text\" ng-if=\"$last\">\n" +
    "                более {{vm.ranges[$index-1].end | intanPercent:2}}\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"intan-range\">\n" +
    "            <div class=\"color intan-disk-30 intan-bg-gray\"></div>\n" +
    "            <div class=\"text\">Нет данных</div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-10 pull-right\">\n" +
    "        <intan-map\n" +
    "                regions=\"vm.mapData\"\n" +
    "                on-mouse-over=\"vm.specifyRegion\"\n" +
    "                on-click=\"vm.selectRegion\"\n" +
    "                tooltip-id=\"public-statistic-region-map-tip\">\n" +
    "        </intan-map>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"form-base _margin-20 _top\">\n" +
    "    <div class=\"form-base__body\">\n" +
    "        <div class=\"form-group form-base__form-group _margin-0 _bottom\">\n" +
    "            <div class=\"col-xs-3\">\n" +
    "                <label>Отображать на диаграмме информацию по территории:</label>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                <div class=\"catalog-choice\">\n" +
    "                    <div class=\"form-base__container-form-control\">\n" +
    "                        <input type=\"text\" class=\"form-control form-base__form-control clearable\"\n" +
    "                               ng-model=\"vm.selectedTerritoryName\"\n" +
    "                               placeholder=\"Все регионы\"\n" +
    "                               readonly=\"true\"\n" +
    "                               clearable ng-change=\"vm.clearTerritory()\"/>\n" +
    "                    </div>\n" +
    "                    <div class=\"catalog-choice__button\" ng-click=\"vm.selectTerritory()\">\n" +
    "                        <span class=\"catalog-choice__icon hif icon-burger-menu\"></span>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\" ng-if=\"vm.pieChartData\">\n" +
    "    <div class=\"col-xs-12 public-statistic-houses-condition-2-pie-chart\">\n" +
    "        <intan-pie-chart data=\"vm.pieChartData\" options=\"vm.pieChartOptions\" width=\"1140\"></intan-pie-chart>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\" ng-if=\"vm.barChartData\">\n" +
    "    <div class=\"col-xs-12 public-statistic-houses-condition-2-bar-chart\">\n" +
    "        <intan-bar-chart data=\"vm.barChartData\" options=\"vm.barChartOptions\" width=\"1140\"></intan-bar-chart>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div id=\"public-statistic-region-map-tip\"\n" +
    "     class=\"public-statistic-region-map-tip popover top form-base form-base__body _padding-0 _top roboto\">\n" +
    "    <div>\n" +
    "        <a href=\"\" class=\"cnt-link text-center\">\n" +
    "            <h4 class=\"tip-popover-title roboto\">{{vm.specifiedRegion.name}}</h4>\n" +
    "        </a>\n" +
    "        <div class=\"lHr _padding-5 _top _bottom\"></div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"vm.specifiedRegion.mkdCount\">\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-xs-2 public-statistic-value text-center\">\n" +
    "                {{vm.specifiedRegion.mainValue | intanPercent: 2}}\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-10\">Общий процент износа жилищного фонда</div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"lHr _margin-10 _top _bottom\"></div>\n" +
    "\n" +
    "        <div class=\"row\" ng-if=\"vm.specifiedRegion.directControlMkdWear\">\n" +
    "            <div class=\"col-xs-2\"></div>\n" +
    "            <div class=\"col-xs-10\">\n" +
    "                {{vm.specifiedRegion.directControlMkdWear | intanPercent}}\n" +
    "                - Непосредственное управление\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\" ng-if=\"vm.specifiedRegion.managementOrganizationMkdWear\">\n" +
    "            <div class=\"col-xs-2\"></div>\n" +
    "            <div class=\"col-xs-10\">\n" +
    "                {{vm.specifiedRegion.managementOrganizationMkdWear | intanPercent}}\n" +
    "                - Управляющая организация\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\" ng-if=\"vm.specifiedRegion.cooperativeMkdWear\">\n" +
    "            <div class=\"col-xs-2\"></div>\n" +
    "            <div class=\"col-xs-10\">\n" +
    "                {{vm.specifiedRegion.cooperativeMkdWear | intanPercent}}\n" +
    "                - ТСЖ, ЖСК, ЖК, иной кооператив\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\" ng-if=\"vm.specifiedRegion.noControlMkdWear\">\n" +
    "            <div class=\"col-xs-2\"></div>\n" +
    "            <div class=\"col-xs-10\">\n" +
    "                {{vm.specifiedRegion.noControlMkdWear | intanPercent}}\n" +
    "                - Способ управления не выбран или не реализован\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\" ng-if=\"vm.specifiedRegion.unpublishedMkdWear\">\n" +
    "            <div class=\"col-xs-2\"></div>\n" +
    "            <div class=\"col-xs-10\">\n" +
    "                {{vm.specifiedRegion.unpublishedMkdWear | intanPercent}}\n" +
    "                - Информация о способе управления не размещена в системе\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"lHr _margin-10 _top _bottom\"></div>\n" +
    "\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-xs-2 public-statistic-value text-center\">\n" +
    "                {{vm.specifiedRegion.mkdCount | number}}\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-10\">\n" +
    "                {{vm.numeralCoherentText(vm.specifiedRegion.mkdCount,\n" +
    "                'Многоквартирный дом (МКД) размещен в системе',\n" +
    "                'Многоквартирных дома (МКД) размещено в системе',\n" +
    "                'Многоквартирных домов (МКД) размещено в системе')}}\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"lHr _margin-10 _top _bottom\"></div>\n" +
    "\n" +
    "        <div class=\"row public-statistic-houses-condition-2-states\">\n" +
    "            <div class=\"col-xs-2 value-col\">\n" +
    "                <div class=\"normal value\">{{vm.specifiedRegion.normalCount}}</div>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-2 text-col\">Исправных<br/>МКД</div>\n" +
    "\n" +
    "            <div class=\"col-xs-2 value-col\">\n" +
    "                <div class=\"slum value\">{{vm.specifiedRegion.slumCount}}</div>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-2 text-col\">Ветхих<br/>МКД</div>\n" +
    "\n" +
    "            <div class=\"col-xs-2 value-col\">\n" +
    "                <div class=\"accident value\">{{vm.specifiedRegion.accidentCount}}</div>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-2 text-col\">Аварийных<br/>МКД</div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <h4 ng-if=\"!vm.specifiedRegion.mkdCount\" class=\"text-center\">Нет данных</h4>\n" +
    "\n" +
    "    <span class=\"arrow tipCorner\"></span>\n" +
    "</div>\n" +
    "");
}]);

angular.module("houses-condition/houses-condition.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("houses-condition/houses-condition.tpl.html",
    "<intan-widget-header page-title=\"vm.pageTitle\" breadcrumbs=\"vm.breadcrumbs\"\n" +
    "    info-date=\"vm.date\"></intan-widget-header>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-3 margin-right-m-100\">\n" +
    "        <div class=\"_margin-50 _top\" ng-if=\"vm.ranges\">\n" +
    "            <div  class=\"_margin-20 _bottom\">\n" +
    "                Процент износа<span ng-show=\"vm.unknownDeteriorationMkdCount > 0\" class=\"cnt_cl_warning\">*</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"intan-range\" ng-if=\"vm.ranges\" ng-repeat=\"range in vm.ranges\">\n" +
    "            <div class=\"color intan-disk-30\" ng-style=\"{'background-color': range.color}\"></div>\n" +
    "            <div class=\"text\">{{range.beginPrefix}} {{range.begin+range.displayBeginCorrection | intanPercent:2:(range.end ? '' : '%'):''}}\n" +
    "                {{range.endPrefix}} {{range.end+range.displayEndCorrection | intanPercent:2:'%':''}}</div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"intan-range\">\n" +
    "            <div class=\"color intan-disk-30 intan-bg-gray\"></div>\n" +
    "            <div class=\"text light\">данные отсутствуют</div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-10 pull-right\">\n" +
    "        <intan-map\n" +
    "            regions=\"vm.regions\"\n" +
    "            on-mouse-over=\"vm.specifyRegion\"\n" +
    "            on-click=\"vm.selectRegion\"\n" +
    "            tooltip-id=\"public-statistic-region-map-tip\">\n" +
    "        </intan-map>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"form-base _margin-20 _top\">\n" +
    "    <div class=\"form-base__body\">\n" +
    "        <div class=\"row form-base__row\">\n" +
    "            <div class=\"form-group form-base__form-group\">\n" +
    "                <label class=\"col-xs-3 control-label form-base__control-label\">\n" +
    "                    Год ввода в эксплуатацию</label>\n" +
    "\n" +
    "                <div class=\"col-xs-9 form-group form-base__form-group\">\n" +
    "                    <rzslider rz-slider-tpl-url=\"shared/rzslider-custom/rzslider-custom.tpl.html\"\n" +
    "                              rz-slider-model=\"vm.yearSlider.minYear\"\n" +
    "                              rz-slider-high=\"vm.yearSlider.maxYear\"\n" +
    "                              rz-slider-options=\"vm.yearSlider.options\">\n" +
    "                    </rzslider>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"form-group form-base__form-group\">\n" +
    "                <label class=\"col-xs-3 control-label form-base__control-label\">\n" +
    "                    Способы управления</label>\n" +
    "\n" +
    "                <div class=\"col-xs-9 form-group form-base__form-group\">\n" +
    "                    <multiselecttree\n" +
    "                        multiple=\"true\"\n" +
    "                        ng-model=\"vm.selectedHouseManagementTypes\"\n" +
    "                        all-select-ability=\"true\"\n" +
    "                        options=\"type.name for type in vm.houseManagementTypes\"\n" +
    "                        change=\"vm.getData()\"\n" +
    "                        header=\"vm.getHouseManagementTypeHeader()\"\n" +
    "                        formapregistaraion=\"true\">\n" +
    "                    </multiselecttree>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"form-group form-base__form-group\">\n" +
    "                <label class=\"col-xs-3 control-label form-base__control-label form-base__control-label_multi\">\n" +
    "                    Отобразить на диаграммах информацию по субъекту РФ</label>\n" +
    "\n" +
    "                <div class=\"col-xs-9 form-group form-base__form-group\">\n" +
    "                    <select ui-select2=\"{minimumResultsForSearch: 0,allowClear:true}\"\n" +
    "                            class=\"form-control form-base__form-control\"\n" +
    "                            ng-model=\"vm.selectedRegion\"\n" +
    "                            data-placeholder=\"Все субъекты РФ\"\n" +
    "                            ng-change=\"vm.getData()\">\n" +
    "                        <option value=\"\"></option>\n" +
    "                        <option ng-repeat=\"regionCode in vm.regionCodes\" value=\"{{regionCode}}\">\n" +
    "                            {{vm.regionNames[regionCode]}}\n" +
    "                        </option>\n" +
    "                    </select>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div id=\"public-statistic-region-map-tip\" class=\"popover top intan-tooltip intan-map-tooltip\">\n" +
    "    <div class=\"header\">\n" +
    "        {{vm.specifiedRegion.name}}\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"separator\"></div>\n" +
    "\n" +
    "    <div ng-show=\"vm.specifiedRegion.value && vm.specifiedRegion.publishedMkdCount\">\n" +
    "\n" +
    "        <div class=\"row top\">\n" +
    "            <div class=\"col-xs-2\">\n" +
    "                <div class=\"value\" ng-style=\"{'background-color': vm.specifiedRegion.fill}\">\n" +
    "                    {{vm.specifiedRegion.deteriorationPercent | intanPercent:2}}</div>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-10\">\n" +
    "                <div class=\"description\">\n" +
    "                    Средний процент износа многоквартирных домов\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"separator\"></div>\n" +
    "\n" +
    "        <div class=\"row _margin-10 _bottom\">\n" +
    "            <div class=\"col-xs-2\"></div>\n" +
    "            <div class=\"col-xs-10\">\n" +
    "                Средний процент износа МКД в разрезе способов управления:\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\" ng-repeat=\"houseManagementType in vm.houseManagementTypeList\">\n" +
    "            <div class=\"col-xs-2 text-right\">\n" +
    "                <span class=\"value\">{{vm.specifiedRegion.percentsByManagementType[houseManagementType.code] | intanPercent:2}}</span>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-10\">\n" +
    "                {{houseManagementType.name}}\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"separator\"></div>\n" +
    "\n" +
    "        <div class=\"row bottom\">\n" +
    "            <div class=\"col-xs-2 text-right\">\n" +
    "                <span class=\"value\">{{vm.specifiedRegion.publishedMkdCount | number}}</span>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-10\">\n" +
    "                <div class=\"description\">\n" +
    "                    {{vm.numeralCoherentText(vm.specifiedRegion.publishedMkdCount,\n" +
    "                        'Многоквартирный дом размещен в системе',\n" +
    "                        'Многоквартирных дома размещено в системе',\n" +
    "                        'Многоквартирных домов размещено в системе')}}\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <h4 class=\"text-center _margin-30 _bottom\"\n" +
    "        ng-show=\"!vm.specifiedRegion.value || !vm.specifiedRegion.publishedMkdCount\">\n" +
    "        В системе не размещено информации о  домах, удовлетворяющих параметрам поиска.\n" +
    "        Попробуйте скорректировать параметры поиска.\n" +
    "    </h4>\n" +
    "\n" +
    "    <span class=\"arrow\"></span>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row _margin-20 _top\" ng-if=\"vm.totalMkd > 0\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <div class=\"bg-color_gray-light _padding-20 _top\">\n" +
    "            <div class=\"h3 uppercase-header bold text-center\">\n" +
    "                Анализ состояния МКД на территории\n" +
    "                {{vm.selectedRegion ? 'субъекта РФ ' + vm.regionNames[vm.selectedRegion] : 'РФ'}}\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"row _padding-30 _top _bottom\">\n" +
    "                <div class=\"col-xs-5 text-center\">\n" +
    "                    <div class=\"intan-houses-condition-bagel-chart\">\n" +
    "                        <intan-bagel-chart\n" +
    "                                radius=\"180\"\n" +
    "                                data=\"vm.chartBagelData\"\n" +
    "                                sizes=\"[[32,25]]\"\n" +
    "                                on-mouse-over=\"vm.specifySector(data)\"\n" +
    "                                on-mouse-out=\"vm.resetSpecifiedSector()\"\n" +
    "                                tooltip-id=\"intan-houses-condition-bagel-chart-tooltip\">\n" +
    "                        </intan-bagel-chart>\n" +
    "\n" +
    "                        <div class=\"chart-responsive-center\">\n" +
    "                            <div class=\"value _padding-0-20\" ng-show=\"vm.specifiedSector\"\n" +
    "                                 ng-style=\"{'color': vm.specifiedSector.color}\">\n" +
    "                                {{vm.specifiedSector.value * 100 | number:2}}%\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "\n" +
    "                <div class=\"col-xs-7 _margin-50 _top\">\n" +
    "                    <span class=\"app-icon app-icon_cl_prime app-icon_xl whhg-city\"></span>\n" +
    "                    <div class=\"h1 app-icon_cl_prime _as-inline-block bold _padding-20 _left _right\">\n" +
    "                        {{vm.totalMkd | number:0}}\n" +
    "                    </div>\n" +
    "                    <div class=\"h5 _as-inline-block _padding-12 _top\">\n" +
    "                        Всего МКД на <br/>выбранной территории\n" +
    "                    </div>\n" +
    "\n" +
    "                    <div class=\"intan-houses-condition-bagel-chart-legend\">\n" +
    "                        <script type=\"text/ng-template\" id=\"intan-house-conditions-condition-info-template\">\n" +
    "                            <div class=\"hcs-popover-tooltip intan-popover-tooltip\">\n" +
    "                                {{condition.info}}\n" +
    "                            </div>\n" +
    "                            <div class=\"triangle\"></div>\n" +
    "                        </script>\n" +
    "                        <div class=\"legend-item\" ng-repeat=\"condition in vm.conditions\">\n" +
    "                            <div class=\"intan-disk-30 disk\"\n" +
    "                                ng-style=\"{'background-color': condition.color}\"></div>\n" +
    "\n" +
    "                            <div class=\"description\">{{workType.name}}\n" +
    "                                <div class=\"_margin-10 _top\">\n" +
    "                                    {{condition.description}}\n" +
    "                                    <intan-info-tooltip\n" +
    "                                        class=\"hcs-popover-tooltip intan-popover-tooltip\"\n" +
    "                                        tooltip-id=\"intan-house-conditions-condition-info-template\"\n" +
    "                                        ng-if=\"condition.info\">\n" +
    "                                    </intan-info-tooltip>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "\n" +
    "                <div id=\"intan-houses-condition-bagel-chart-tooltip\"\n" +
    "                    class=\"popover top intan-tooltip intan-houses-condition-bagel-chart-tooltip\">\n" +
    "\n" +
    "                    <div class=\"row\">\n" +
    "                        <div class=\"col-xs-12 _no-wrap\">\n" +
    "                            <span class=\"value\" ng-style=\"{'background-color': vm.specifiedSector.color}\">\n" +
    "                                {{vm.specifiedSector.count | number:0}}\n" +
    "                            </span>\n" +
    "                            <span class=\"value _margin-15 _left\" ng-style=\"{'background-color': vm.specifiedSector.color}\">\n" +
    "                                {{vm.specifiedSector.value | intanPercent:2}}\n" +
    "                            </span>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "\n" +
    "                    <div class=\"row\">\n" +
    "                        <div class=\"col-xs-12\">\n" +
    "                            {{vm.specifiedSector.hint}}\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row _margin-20 _top\" ng-if=\"vm.totalMkd > 0\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <div class=\"bg-color_gray-light _padding-20 _top\">\n" +
    "            <div class=\"h3 uppercase-header bold text-center\">\n" +
    "                Средний процент износа МКД на территории\n" +
    "                {{vm.selectedRegion ? 'субъекта РФ ' + vm.regionNames[vm.selectedRegion] : 'РФ'}}\n" +
    "                по году ввода в эксплуатацию<span ng-show=\"vm.unknownDeteriorationMkdCount > 0\" class=\"cnt_cl_warning\">*</span>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"intan-houses-condition-bar-chart\">\n" +
    "                <intan-bar-chart\n" +
    "                    data=\"vm.barChartData\"\n" +
    "                    options=\"vm.barChartOptions\"\n" +
    "                    width=\"1120\"\n" +
    "                    on-mouse-over=\"vm.setBarChartDetails\"\n" +
    "                    tooltip-id=\"intan-houses-condition-bar-chart-tooltip\">\n" +
    "                </intan-bar-chart>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div id=\"intan-houses-condition-bar-chart-tooltip\"\n" +
    "        class=\"popover top intan-tooltip intan-houses-condition-bar-chart-tooltip\">\n" +
    "\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-xs-12\">\n" +
    "                Средний процент износа домов, у которых год ввода в эксплутацию соответствует периоду\n" +
    "                <span class=\"bold\">{{vm.barChartDetails.label}}\n" +
    "                    {{vm.barChartDetails.label.indexOf('-') === -1 ? 'г.' : 'гг.'}}</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-xs-12\">\n" +
    "                <span class=\"value\">\n" +
    "                    {{vm.barChartDetails.value | number:0}}%\n" +
    "                </span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"_margin-20 _all intan-annotation\" ng-if=\"vm.unknownDeteriorationMkdCount > 0\">\n" +
    "    <span class=\"cnt_cl_warning\">*</span>&emsp;Примечание: в расчете не участвуют {{vm.unknownDeteriorationMkdCount |\n" +
    "    number}} МКД, по которым не размещена информация об общем проценте износа\n" +
    "</div>\n" +
    "");
}]);

angular.module("main-forms/ef-rosstat/ef-rosstat-following-tooltip.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("main-forms/ef-rosstat/ef-rosstat-following-tooltip.tpl.html",
    "<div ng-bind-html=\"hcsFollowingTooltip.html\" class=\"hcs-following-tooltip\" style=\"\n" +
    "    position: absolute;\n" +
    "    top: {{hcsFollowingTooltip.top}}px;\n" +
    "    left: {{hcsFollowingTooltip.left}}px;\n" +
    "    width: {{hcsFollowingTooltip.width}};\n" +
    "    height: {{hcsFollowingTooltip.height}};\n" +
    "    display: {{hcsFollowingTooltip.display && hcsFollowingTooltip.hover ? 'block' : 'none' }};\n" +
    "  \">\n" +
    "    <!-- HTML value will be placed here -->\n" +
    "</div>");
}]);

angular.module("main-forms/ef-rosstat/ef-rosstat-grants/ef-rosstat-grants.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("main-forms/ef-rosstat/ef-rosstat-grants/ef-rosstat-grants.tpl.html",
    "<form-header page-title=\"pageTitle\" breadcrumbs=\"breadcrumbs\"></form-header>\n" +
    "<span class=\"metering-devices__legend-desc rosstat-span_off\">По официальным данным Росстата по состоянию на сентябрь 2016 г.</span>\n" +
    "<div class=\"row rosstat-div_row\">\n" +
    "    <div class=\"col-xs-4\">\n" +
    "        <div class=\"row search-obj__result-num\">\n" +
    "            <span class=\"col-xs-9 rosstat-headblock-content\">Доля семей, пользующихся субсидиями</span>\n" +
    "            <div class=\"col-xs-3 rosstat-headblock\">\n" +
    "                <span class=\"rosstat-headblock-bigtext\">6,0%</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "    <div class=\"col-xs-4\">\n" +
    "        <div class=\"row search-obj__result-num\">\n" +
    "            <span class=\"col-xs-9 rosstat-headblock-content\">Доля граждан, пользующихся социальной поддержкой</span>\n" +
    "            <div class=\"col-xs-3 rosstat-headblock\">\n" +
    "                <span class=\"rosstat-headblock-bigtext\">25%</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "</div>\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-12 component-slider\" style=\"margin-top: 50px\">\n" +
    "\n" +
    "        <carousel interval=\"newsCarouselInterval\" class=\"rosstat-carousel-main\" fix-carousel-animation=\"true\">\n" +
    "            <slide class=\"rosstat-carousel-background\">\n" +
    "                <div class=\"info-panel__data info-panel__data_size_lg\" style=\"font-size: 22px; display: inline-block\">\n" +
    "                    <span class=\"info-panel__val info-panel__val_attn\" style=\"display: block;text-align: left;padding-left: 70px\">Средний размер социальной поддержки</span>\n" +
    "                    <img src=\"assets/img/rosstat/grants/crash_share.jpg\" style=\"margin:30px auto 0 auto;\" usemap=\"#crash_share\">\n" +
    "                    <map name=\"crash_share\">\n" +
    "                        <area shape=\"poly\" coords=\"72,414,72,398,95,400,123,387,124,412\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;32 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер социальной поддержки&lt;br/&gt; в 2000 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"70,398,71,379,95,380,121,323,124,386,97,398\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;80 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер субсидии &lt;br/&gt;в 2000 году\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"129,412,130,382,178,360,179,413\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;179 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер социальной поддержки&lt;br/&gt; в 2005 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"129,385,126,318,156,257,180,241,178,357\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;550 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер субсидии &lt;br/&gt;в 2005 году\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"181,414,182,357,209,345,242,335,239,414\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;217 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер социальной поддержки&lt;br/&gt; в 2006 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"182,239,211,222,237,224,240,333,210,342,181,354\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;675 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер субсидии &lt;br/&gt;в 2006 году\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"243,414,244,334,271,330,299,326,297,412\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;259 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер социальной поддержки&lt;br/&gt; в 2007 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"242,331,239,223,271,225,298,222,300,323\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;641 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер субсидии &lt;br/&gt;в 2007 году\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"300,413,303,324,326,320,355,310,357,411\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;307 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер социальной поддержки&lt;br/&gt; в 2008 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"302,322,300,222,328,218,357,198,356,307,328,319\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;668 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер субсидии &lt;br/&gt;в 2008 году\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"359,411,358,308,388,300,414,286,412,414\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;394 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер социальной поддержки &lt;br/&gt;в 2009 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"359,306,359,194,387,176,414,166,413,283,387,296\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;809 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер субсидии&lt;br/&gt;в 2009 году\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"415,414,417,285,443,271,473,266,472,412\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;477 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер социальной поддержки&lt;br/&gt;в 2010 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"415,283,416,165,444,155,473,137,470,265\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;896 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер субсидии&lt;br/&gt;в 2010 году\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"474,411,477,266,501,262,530,258,529,413\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;537 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер социальной поддержки&lt;br/&gt;в 2011 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"475,266,476,132,500,114,532,118,528,257\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1029 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер субсидии&lt;br/&gt;в 2011 году\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"533,413,533,258,560,255,588,246,584,412\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;549 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер социальной поддержки&lt;br/&gt;в 2012 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"532,255,535,118,560,121,588,106,587,242,559,251\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1013 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер субсидии&lt;br/&gt;в 2012 году\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"588,410,592,246,616,239,648,234,647,411\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;598 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер социальной поддержки&lt;br/&gt;в 2013 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"590,243,591,106,617,92,648,84,647,230\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1096 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер субсидии&lt;br/&gt;в 2013 году\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"651,410,651,234,704,225,706,410\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;623 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер социальной поддержки&lt;br/&gt;в 2014 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"652,230,651,84,704,64,704,222\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1157 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер субсидии&lt;br/&gt;в 2014 году\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"710,412,708,225,760,221,758,413\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;654 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер социальной поддержки&lt;br/&gt;в 2015 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"709,222,708,63,737,50,760,50,760,217\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1241 руб.&lt;/span&gt;&lt;br/&gt;ежемесячный размер субсидии&lt;br/&gt;в 2015 году\"/>\n" +
    "                    </map>\n" +
    "                </div>\n" +
    "            </slide>\n" +
    "            <slide class=\"rosstat-carousel-background\">\n" +
    "                <div class=\"info-panel__data info-panel__data_size_lg\" style=\"font-size: 22px; display: inline-block\">\n" +
    "                    <span class=\"info-panel__val info-panel__val_attn\" style=\"display: block;text-align: left;padding-left: 60px\">Статистика использования гражданами средств поддержки по оплате ЖКУ</span>\n" +
    "                    <img src=\"assets/img/rosstat/grants/crash.jpg\" style=\"margin:30px auto 0 auto;\" usemap=\"#crash\">\n" +
    "                    <map name=\"crash\">\n" +
    "                        <area shape=\"rect\" coords=\"73,386,92,312\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;7,7%&lt;/span&gt;&lt;br/&gt;граждан пользовались субсидиями в 2000 году\"/>\n" +
    "                        <area shape=\"rect\" coords=\"93,386,116,91\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;31%&lt;/span&gt;&lt;br/&gt;граждан имели льготы в 2000 году\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"135,386,155,273\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;11,9%&lt;/span&gt;&lt;br/&gt;граждан пользовались субсидиями в 2005 году\"/>\n" +
    "                        <area shape=\"rect\" coords=\"156,386,179,141\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;26%&lt;/span&gt;&lt;br/&gt;граждан имели льготы в 2005 году\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"197,386,219,283\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;10,6%&lt;/span&gt;&lt;br/&gt;граждан пользовались субсидиями в 2006 году\"/>\n" +
    "                        <area shape=\"rect\" coords=\"220,386,242,119\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;28%&lt;/span&gt;&lt;br/&gt;граждан имели льготы в 2006 году\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"260,386,280,300\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;8,8%&lt;/span&gt;&lt;br/&gt;граждан пользовались субсидиями в 2007 году\"/>\n" +
    "                        <area shape=\"rect\" coords=\"281,386,305,129\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;27%&lt;/span&gt;&lt;br/&gt;граждан имели льготы в 2007 году\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"323,386,344,310\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;7,9%&lt;/span&gt;&lt;br/&gt;граждан пользовались субсидиями в 2008 году\"/>\n" +
    "                        <area shape=\"rect\" coords=\"345,386,367,129\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;27%&lt;/span&gt;&lt;br/&gt;граждан имели льготы в 2008 году\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"387,386,409,304\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;8,3%&lt;/span&gt;&lt;br/&gt;граждан пользовались субсидиями в 2009 году\"/>\n" +
    "                        <area shape=\"rect\" coords=\"410,386,431,142\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;26%&lt;/span&gt;&lt;br/&gt;граждан имели льготы в 2009 году\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"450,386,470,314\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;7,3%&lt;/span&gt;&lt;br/&gt;граждан пользовались субсидиями в 2010 году\"/>\n" +
    "                        <area shape=\"rect\" coords=\"471,386,493,142\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;26%&lt;/span&gt;&lt;br/&gt;граждан имели льготы в 2010 году\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"512,386,532,319\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;7,2%&lt;/span&gt;&lt;br/&gt;граждан пользовались субсидиями в 2011 году\"/>\n" +
    "                        <area shape=\"rect\" coords=\"533,386,556,141\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;26%&lt;/span&gt;&lt;br/&gt;граждан имели льготы в 2011 году\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"573,386,592,321\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;6,9%&lt;/span&gt;&lt;br/&gt;граждан пользовались субсидиями в 2012 году\"/>\n" +
    "                        <area shape=\"rect\" coords=\"593,386,618,141\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;26%&lt;/span&gt;&lt;br/&gt;граждан имели льготы в 2012 году\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"638,386,660,326\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;6,4%&lt;/span&gt;&lt;br/&gt;граждан пользовались субсидиями в 2013 году\"/>\n" +
    "                        <area shape=\"rect\" coords=\"659,386,682,141\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;26%&lt;/span&gt;&lt;br/&gt;граждан имели льготы в 2013 году\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"702,386,723,330\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;6,1%&lt;/span&gt;&lt;br/&gt;граждан пользовались субсидиями в 2014 году\"/>\n" +
    "                        <area shape=\"rect\" coords=\"724,386,745,149\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;25%&lt;/span&gt;&lt;br/&gt;граждан имели льготы в 2014 году\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"765,386,786,330\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;6,0%&lt;/span&gt;&lt;br/&gt;граждан пользовались субсидиями в 2015 году\"/>\n" +
    "                        <area shape=\"rect\" coords=\"787,386,810,149\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;25%&lt;/span&gt;&lt;br/&gt;граждан имели льготы в 2015 году\"/>\n" +
    "                    </map>\n" +
    "                </div>\n" +
    "            </slide>\n" +
    "        </carousel>\n" +
    "\n" +
    "    </div>\n" +
    "</div>");
}]);

angular.module("main-forms/ef-rosstat/ef-rosstat-housing-stock/ef-rosstat-housing-stock.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("main-forms/ef-rosstat/ef-rosstat-housing-stock/ef-rosstat-housing-stock.tpl.html",
    "<form-header page-title=\"pageTitle\" breadcrumbs=\"breadcrumbs\"></form-header>\n" +
    "<span class=\"metering-devices__legend-desc rosstat-span_off\">По официальным данным Росстата по состоянию на сентябрь 2015 г.</span>\n" +
    "<div class=\"row rosstat-div_row\">\n" +
    "    <div class=\"col-xs-4\">\n" +
    "        <div class=\"row search-obj__result-num\">\n" +
    "            <span class=\"col-xs-9 rosstat-headblock-content\">Весь ветхий и аварийный жилищный фонд составляет</span>\n" +
    "             <div class=\"col-xs-3 rosstat-headblock\">\n" +
    "                <span  class=\"rosstat-headblock-bigtext\">93,3</span><br>\n" +
    "                <span  class=\"rosstat-headblock-smalltext\">млн.кв.м</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "    <div class=\"col-xs-4\">\n" +
    "        <div class=\"row search-obj__result-num\">\n" +
    "            <span class=\"col-xs-9 rosstat-headblock-content\">Доля такого фонда составляет</span>\n" +
    "             <div class=\"col-xs-3 rosstat-headblock\">\n" +
    "                <span class=\"rosstat-headblock-bigtext\">2,7%</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "</div>\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-12 component-slider\" style=\"margin-top: 50px\">\n" +
    "        <carousel interval=\"newsCarouselInterval\" class=\"rosstat-carousel-main\" fix-carousel-animation=\"true\">\n" +
    "            <slide class=\"rosstat-carousel-background\">\n" +
    "                <div class=\"info-panel__data info-panel__data_size_lg rosstat-item-box\">\n" +
    "                    <span class=\"info-panel__val info-panel__val_attn\" style=\"display: block;text-align: left;padding-left: 5px\">Капитальный ремонт многоквартирных домов</span>\n" +
    "                    <img src=\"assets/img/rosstat/housing_stock/overhaul.jpg\" class=\"rosstat-image\" usemap=\"#overhaul\">\n" +
    "                    <map name=\"overhaul\">\n" +
    "                        <area shape=\"rect\" coords=\"4,318,189,58\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;29 103 тыс. кв. м&lt;/span&gt;&lt;br/&gt;помещений отремонтировано&lt;br/&gt;в 1990 году\">\n" +
    "                        <area shape=\"rect\" coords=\"189,318,266,58\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;11 666 тыс. кв. м&lt;/span&gt;&lt;br/&gt;помещений отремонтировано&lt;br/&gt;в 1995 году\">\n" +
    "                        <area shape=\"rect\" coords=\"266,318,292,58\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;3 832 тыс. кв. м&lt;/span&gt;&lt;br/&gt;помещений отремонтировано&lt;br/&gt;в 2000 году\">\n" +
    "                        <area shape=\"rect\" coords=\"292,318,327,58\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;5 552 тыс. кв. м&lt;/span&gt;&lt;br/&gt;помещений отремонтировано&lt;br/&gt;в 2005 году\">\n" +
    "                        <area shape=\"rect\" coords=\"327,318,360,58\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;5 302 тыс. кв. м&lt;/span&gt;&lt;br/&gt;помещений отремонтировано&lt;br/&gt;в 2006 году\">\n" +
    "                        <area shape=\"rect\" coords=\"360,318,408,58\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;6 707 тыс. кв. м&lt;/span&gt;&lt;br/&gt;помещений отремонтировано&lt;br/&gt;в 2007 году\">\n" +
    "                        <area shape=\"rect\" coords=\"408,318,483,58\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;12 381 тыс. кв. м&lt;/span&gt;&lt;br/&gt;помещений отремонтировано&lt;br/&gt;в 2008 году\">\n" +
    "                        <area shape=\"rect\" coords=\"483,318,594,58\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;17 316 тыс. кв. м&lt;/span&gt;&lt;br/&gt;помещений отремонтировано&lt;br/&gt;в 2009 году\">\n" +
    "                        <area shape=\"rect\" coords=\"594,318,646,58\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;8 660 тыс. кв. м&lt;/span&gt;&lt;br/&gt;помещений отремонтировано&lt;br/&gt;в 2010 году\">\n" +
    "                        <area shape=\"rect\" coords=\"646,318,674,58\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;4 326 тыс. кв. м&lt;/span&gt;&lt;br/&gt;помещений отремонтировано&lt;br/&gt;в 2011 году\">\n" +
    "                        <area shape=\"rect\" coords=\"674,318,697,58\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;3 995 тыс. кв. м&lt;/span&gt;&lt;br/&gt;помещений отремонтировано&lt;br/&gt;в 2012 году\">\n" +
    "                        <area shape=\"rect\" coords=\"697,318,718,58\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;3 045 тыс. кв. м&lt;/span&gt;&lt;br/&gt;помещений отремонтировано&lt;br/&gt;в 2013 году\">\n" +
    "                        <area shape=\"rect\" coords=\"718,318,736,58\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2 836 тыс. кв. м&lt;/span&gt;&lt;br/&gt;помещений отремонтировано&lt;br/&gt;в 2014 году\">\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"42,380,93,396\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;10 000 тыс. кв. м&lt;/span&gt;&lt;br/&gt;отремонтированных помещений&lt;br/&gt;нарастающим итогом с 1990 года\">\n" +
    "                        <area shape=\"rect\" coords=\"104,380,153,396\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;20 000 тыс. кв. м&lt;/span&gt;&lt;br/&gt;отремонтированных помещений&lt;br/&gt;нарастающим итогом с 1990 года\">\n" +
    "                        <area shape=\"rect\" coords=\"169,380,216,396\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;30 000 тыс. кв. м&lt;/span&gt;&lt;br/&gt;отремонтированных помещений&lt;br/&gt;нарастающим итогом с 1990 года\">\n" +
    "                        <area shape=\"rect\" coords=\"233,380,277,396\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;40 000 тыс. кв. м&lt;/span&gt;&lt;br/&gt;отремонтированных помещений&lt;br/&gt;нарастающим итогом с 1990 года\">\n" +
    "                        <area shape=\"rect\" coords=\"298,380,345,396\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;50 000 тыс. кв. м&lt;/span&gt;&lt;br/&gt;отремонтированных помещений&lt;br/&gt;нарастающим итогом с 1990 года\">\n" +
    "                        <area shape=\"rect\" coords=\"363,380,409,396\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;60 000 тыс. кв. м&lt;/span&gt;&lt;br/&gt;отремонтированных помещений&lt;br/&gt;нарастающим итогом с 1990 года\">\n" +
    "                        <area shape=\"rect\" coords=\"426,380,475,396\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;70 000 тыс. кв. м&lt;/span&gt;&lt;br/&gt;отремонтированных помещений&lt;br/&gt;нарастающим итогом с 1990 года\">\n" +
    "                        <area shape=\"rect\" coords=\"491,380,539,396\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;80 000 тыс. кв. м&lt;/span&gt;&lt;br/&gt;отремонтированных помещений&lt;br/&gt;нарастающим итогом с 1990 года\">\n" +
    "                        <area shape=\"rect\" coords=\"556,380,605,396\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;90 000 тыс. кв. м&lt;/span&gt;&lt;br/&gt;отремонтированных помещений&lt;br/&gt;нарастающим итогом с 1990 года\">\n" +
    "                        <area shape=\"rect\" coords=\"613,380,668,396\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;100 000 тыс. кв. м&lt;/span&gt;&lt;br/&gt;отремонтированных помещений&lt;br/&gt;нарастающим итогом с 1990 года\">\n" +
    "                        <area shape=\"rect\" coords=\"678,380,735,396\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;110 000 тыс. кв. м&lt;/span&gt;&lt;br/&gt;отремонтированных помещений&lt;br/&gt;нарастающим итогом с 1990 года\">\n" +
    "                        <area shape=\"rect\" coords=\"743,380,800,396\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;120 000 тыс. кв. м&lt;/span&gt;&lt;br/&gt;отремонтированных помещений&lt;br/&gt;нарастающим итогом с 1990 года\">\n" +
    "                    </map>\n" +
    "                </div>\n" +
    "            </slide>\n" +
    "            <slide class=\"rosstat-carousel-background\">\n" +
    "                <div class=\"info-panel__data info-panel__data_size_lg rosstat-item-box\">\n" +
    "                    <span class=\"info-panel__val info-panel__val_attn\" style=\"display: block;text-align: left;padding-left: 85px\">Сведения о ветхом и аварийном фонде</span>\n" +
    "                    <img src=\"assets/img/rosstat/housing_stock/crash.jpg\" class=\"rosstat-image\" usemap=\"#crash\">\n" +
    "                    <map name=\"crash\">\n" +
    "                        <area shape=\"rect\" coords=\"32,9,142,43\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2014 г.&lt;/span&gt;&lt;br/&gt;93,3 млн. кв. м всего ветхого и&lt;br/&gt;аварийного фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"32,47,142,81\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2013 г.&lt;/span&gt;&lt;br/&gt;93,9 млн. кв. м всего ветхого и&lt;br/&gt;аварийного фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"32,84,142,118\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2012 г.&lt;/span&gt;&lt;br/&gt;99,9 млн. кв. м всего ветхого и&lt;br/&gt;аварийного фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"32,123,142,156\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2011 г.&lt;/span&gt;&lt;br/&gt;98,9 млн. кв. м всего ветхого и&lt;br/&gt;аварийного фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"32,161,142,194\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2010 г.&lt;/span&gt;&lt;br/&gt;99,4 млн. кв. м всего ветхого и&lt;br/&gt;аварийного фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"32,199,142,232\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2009 г.&lt;/span&gt;&lt;br/&gt;99,5 млн. кв. м всего ветхого и&lt;br/&gt;аварийного фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"32,237,142,270\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2008 г.&lt;/span&gt;&lt;br/&gt;99,7 млн. кв. м всего ветхого и&lt;br/&gt;аварийного фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"32,275,142,308\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2007 г.&lt;/span&gt;&lt;br/&gt;99,1 млн. кв. м всего ветхого и&lt;br/&gt;аварийного фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"32,313,142,346\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2006 г.&lt;/span&gt;&lt;br/&gt;95,9 млн. кв. м всего ветхого и&lt;br/&gt;аварийного фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"32,350,142,385\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2005 г.&lt;/span&gt;&lt;br/&gt;94,6 млн. кв. м всего ветхого и&lt;br/&gt;аварийного фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"32,389,142,422\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2000 г.&lt;/span&gt;&lt;br/&gt;65,6 млн. кв. м всего ветхого и&lt;br/&gt;аварийного фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"32,427,142,460\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1995 г.&lt;/span&gt;&lt;br/&gt;37,7 млн. кв. м всего ветхого и&lt;br/&gt;аварийного фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"32,465,142,497\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1990 г.&lt;/span&gt;&lt;br/&gt;32,2 млн. кв. м всего ветхого и&lt;br/&gt;аварийного фонда\"/>\n" +
    "\n" +
    "\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"148,466,279,499\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1990 г.&lt;/span&gt;&lt;br/&gt;28,9 млн. кв. м ветхого фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"280,466,296,499\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1990 г.&lt;/span&gt;&lt;br/&gt;3,3 млн. кв. м аварийного фонда\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"148,427,299,461\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1995 г.&lt;/span&gt;&lt;br/&gt;32,8 млн. кв. м ветхого фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"300,427,321,461\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1995 г.&lt;/span&gt;&lt;br/&gt;4,9 млн. кв. м аварийного фонда\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"148,389,431,422\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2000 г.&lt;/span&gt;&lt;br/&gt;56,1 млн. кв. м ветхого фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"432,389,476,422\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2000 г.&lt;/span&gt;&lt;br/&gt;9,5 млн. кв. м аварийного фонда\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"148,351,566,384\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2005 г.&lt;/span&gt;&lt;br/&gt;83,4 млн. кв. м ветхого фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"567,351,613,384\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2005 г.&lt;/span&gt;&lt;br/&gt;11,2 млн. кв. м аварийного фонда\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"148,313,566,347\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2006 г.&lt;/span&gt;&lt;br/&gt;83,2 млн. кв. м ветхого фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"567,313,619,347\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2006 г.&lt;/span&gt;&lt;br/&gt;12,7 млн. кв. м аварийного фонда\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"148,275,571,308\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2007 г.&lt;/span&gt;&lt;br/&gt;84 млн. кв. м ветхого фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"572,275,641,308\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2007 г.&lt;/span&gt;&lt;br/&gt;15,1 млн. кв. м аварийного фонда\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"148,237,566,270\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2008 г.&lt;/span&gt;&lt;br/&gt;83,2 млн. кв. м ветхого фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"567,237,645,270\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2008 г.&lt;/span&gt;&lt;br/&gt;16,5 млн. кв. м аварийного фонда\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"148,199,549,232\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2009 г.&lt;/span&gt;&lt;br/&gt;80,1 млн. кв. м ветхого фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"550,199,644,232\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2009 г.&lt;/span&gt;&lt;br/&gt;19,4 млн. кв. м аварийного фонда\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"148,161,540,195\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2010 г.&lt;/span&gt;&lt;br/&gt;78,9 млн. кв. м ветхого фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"541,161,644,195\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2010 г.&lt;/span&gt;&lt;br/&gt;20,5 млн. кв. м аварийного фонда\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"148,123,537,156\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2011 г.&lt;/span&gt;&lt;br/&gt;78,4 млн. кв. м ветхого фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"538,123,640,156\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2011 г.&lt;/span&gt;&lt;br/&gt;20,5 млн. кв. м аварийного фонда\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"148,85,531,118\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2012 г.&lt;/span&gt;&lt;br/&gt;77,7 млн. кв. м ветхого фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"532,85,648,118\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2012 г.&lt;/span&gt;&lt;br/&gt;22,2 млн. кв. м аварийного фонда\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"148,47,500,81\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2013 г.&lt;/span&gt;&lt;br/&gt;70,1 млн. кв. м ветхого фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"501,47,615,81\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2013 г.&lt;/span&gt;&lt;br/&gt;23,8 млн. кв. м аварийного фонда\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"148,9,496,43\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2014 г.&lt;/span&gt;&lt;br/&gt;69,5 млн. кв. м ветхого фонда\"/>\n" +
    "                        <area shape=\"rect\" coords=\"496,9,612,43\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2014 г.&lt;/span&gt;&lt;br/&gt;23,8 млн. кв. м аварийного фонда\"/>\n" +
    "                    </map>\n" +
    "                </div>\n" +
    "            </slide>\n" +
    "            <slide class=\"rosstat-carousel-background\">\n" +
    "                <div class=\"info-panel__data info-panel__data_size_lg rosstat-item-box\">\n" +
    "                    <span class=\"info-panel__val info-panel__val_attn\" style=\"display: block;text-align: left;padding-left: 50px\">Доля ветхого и аварийного жилищного фонда</span>\n" +
    "                    <img src=\"assets/img/rosstat/housing_stock/share_crashes.jpg\" class=\"rosstat-image\" usemap=\"#share_crashes\">\n" +
    "                    <map name=\"share_crashes\">\n" +
    "                        <area shape=\"poly\" coords=\"47,474,95,474,95,257,71,263,47,263\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1,3 %&lt;/span&gt;&lt;br/&gt;Доля ветхого и аварийного фонда&lt;br/&gt;в 1990 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"102,474,150,474,150,205,127,252,102,257\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1,4 %&lt;/span&gt;&lt;br/&gt;Доля ветхого и аварийного фонда&lt;br/&gt;в 1995 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"157,474,205,474,205,98,183,141,157,192\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2,4 %&lt;/span&gt;&lt;br/&gt;Доля ветхого и аварийного фонда&lt;br/&gt;в 2000 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"212,474,260,474,260,38,237,38,212,85\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;3,2 %&lt;/span&gt;&lt;br/&gt;Доля ветхого и аварийного фонда&lt;br/&gt;в 2005 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"267,474,315,474,315,37,293,37,267,37\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;3,2 %&lt;/span&gt;&lt;br/&gt;Доля ветхого и аварийного фонда&lt;br/&gt;в 2006 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"322,474,370,474,370,37,348,37,322,37\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;3,2 %&lt;/span&gt;&lt;br/&gt;Доля ветхого и аварийного фонда&lt;br/&gt;в 2007 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"377,474,425,474,425,42,402,37,377,37\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;3,2 %&lt;/span&gt;&lt;br/&gt;Доля ветхого и аварийного фонда&lt;br/&gt;в 2008 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"432,474,481,474,481,49,457,50,432,44\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;3,1 %&lt;/span&gt;&lt;br/&gt;Доля ветхого и аварийного фонда&lt;br/&gt;в 2009 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"487,474,535,474,535,55,512,50,487,49\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;3,1 %&lt;/span&gt;&lt;br/&gt;Доля ветхого и аварийного фонда&lt;br/&gt;в 2010 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"542,474,590,474,590,63,567,63,542,57\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;3 %&lt;/span&gt;&lt;br/&gt;Доля ветхого и аварийного фонда&lt;br/&gt;в 2011 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"597,474,645,474,645,72,624,63,597,63\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;3 %&lt;/span&gt;&lt;br/&gt;Доля ветхого и аварийного фонда&lt;br/&gt;в 2012 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"652,474,700,474,700,89,677,85,652,75\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2,8 %&lt;/span&gt;&lt;br/&gt;Доля ветхого и аварийного фонда&lt;br/&gt;в 2013 году\"/>\n" +
    "                        <area shape=\"poly\" coords=\"707,474,755,474,755,93,730,93,707,89\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2,7 %&lt;/span&gt;&lt;br/&gt;Доля ветхого и аварийного фонда&lt;br/&gt;в 2014 году\"/>\n" +
    "                    </map>\n" +
    "                </div>\n" +
    "            </slide>\n" +
    "        </carousel>\n" +
    "\n" +
    "\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("main-forms/ef-rosstat/ef-rosstat-municipal-infrastructure/ef-rosstat-municipal-infrastructure.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("main-forms/ef-rosstat/ef-rosstat-municipal-infrastructure/ef-rosstat-municipal-infrastructure.tpl.html",
    "<form-header page-title=\"pageTitle\" breadcrumbs=\"breadcrumbs\"></form-header>\n" +
    "<span class=\"metering-devices__legend-desc rosstat-span_off\">По официальным данным Росстата по состоянию на сентябрь 2016 г.</span>\n" +
    "\n" +
    "<h2>Благоустройство жилищного фонда</h2>\n" +
    "<div class=\"row rosstat-div_row\">\n" +
    "    <div class=\"col-xs-3\">\n" +
    "        <div class=\"row search-obj__result-num\">\n" +
    "            <span class=\"col-xs-9 rosstat-headblock-content\">Доля жилищного фонда, оборудованного централизованным ХВС</span>\n" +
    "             <div class=\"col-xs-3 rosstat-headblock\">\n" +
    "                <span  class=\"rosstat-headblock-bigtext\">81%</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "    <div class=\"col-xs-3\">\n" +
    "        <div class=\"row search-obj__result-num\">\n" +
    "            <span class=\"col-xs-9 rosstat-headblock-content\">Доля жилищного фонда, оборудованного централизованным ГВС</span>\n" +
    "            <div class=\"col-xs-3 rosstat-headblock\">\n" +
    "                <span class=\"rosstat-headblock-bigtext\">68%</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "    <div class=\"col-xs-3\">\n" +
    "        <div class=\"row search-obj__result-num\">\n" +
    "            <span class=\"col-xs-9 rosstat-headblock-content\">Доля жилищного фонда, оборудованного водоотведением (канализацией) </span>\n" +
    "             <div class=\"col-xs-3 rosstat-headblock\">\n" +
    "                <span  class=\"rosstat-headblock-bigtext\">77%</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "    <div class=\"col-xs-3\">\n" +
    "        <div class=\"row search-obj__result-num\">\n" +
    "            <span class=\"col-xs-9 rosstat-headblock-content\">Доля жилищного фонда, оборудованного газом (включая СУГ) </span>\n" +
    "             <div class=\"col-xs-3 rosstat-headblock\">\n" +
    "                <span  class=\"rosstat-headblock-bigtext\">67%</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "</div>\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-12 component-slider\" style=\"margin-top: 50px\">\n" +
    "\n" +
    "        <carousel interval=\"newsCarouselInterval\" class=\"rosstat-carousel-main\" fix-carousel-animation=\"true\">\n" +
    "            <slide class=\"rosstat-carousel-background\">\n" +
    "                <div class=\"info-panel__data info-panel__data_size_lg rosstat-item-box\">\n" +
    "                    <span class=\"info-panel__val info-panel__val_attn\" style=\"display: block;text-align: left;padding-left: 65px\">Число аварий в сетях централизованного снабжения</span>\n" +
    "                    <img src=\"assets/img/rosstat/municipal-infrastructure/crash.jpg\" class=\"rosstat-image\" usemap=\"#crash\">\n" +
    "                    <map name=\"crash\">\n" +
    "                        <area shape=\"rect\" coords=\"65,443,119,170\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2004 г.&lt;/span&gt;&lt;br/&gt;204,1 тыс. аварий в сетях ХВС\"/>\n" +
    "                        <area shape=\"rect\" coords=\"65,170,119,132\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2004 г.&lt;/span&gt;&lt;br/&gt;34,7 тыс. аварий канализации\"/>\n" +
    "                        <area shape=\"rect\" coords=\"65,132,119,82\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2004 г.&lt;/span&gt;&lt;br/&gt;34,519 тыс. аварий на источниках теплоснабжения, паровых и тепловых сетях\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"123,443,177,176\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2005 г.&lt;/span&gt;&lt;br/&gt;197,7 тыс. аварий в сетях ХВС\"/>\n" +
    "                        <area shape=\"rect\" coords=\"123,176,177,136\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2005 г.&lt;/span&gt;&lt;br/&gt;38,4 тыс. аварий канализации\"/>\n" +
    "                        <area shape=\"rect\" coords=\"123,135,177,95\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2005 г.&lt;/span&gt;&lt;br/&gt;27,605 тыс. аварий на источниках теплоснабжения, паровых и тепловых сетях\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"182,443,236,184\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2006 г.&lt;/span&gt;&lt;br/&gt;195,4 тыс. аварий в сетях ХВС\"/>\n" +
    "                        <area shape=\"rect\" coords=\"182,183,236,140\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2006 г.&lt;/span&gt;&lt;br/&gt;38,8 тыс. аварий канализации\"/>\n" +
    "                        <area shape=\"rect\" coords=\"182,139,236,102\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2006 г.&lt;/span&gt;&lt;br/&gt;22,038 тыс. аварий на источниках теплоснабжения, паровых и тепловых сетях\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"240,443,295,180\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2007 г.&lt;/span&gt;&lt;br/&gt;196,9 тыс. аварий в сетях ХВС\"/>\n" +
    "                        <area shape=\"rect\" coords=\"240,179,295,133\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2007 г.&lt;/span&gt;&lt;br/&gt;41,5 тыс. аварий канализации\"/>\n" +
    "                        <area shape=\"rect\" coords=\"240,132,295,100\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2007 г.&lt;/span&gt;&lt;br/&gt;20,107 тыс. аварий на источниках теплоснабжения, паровых и тепловых сетях\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"300,443,355,196\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2008 г.&lt;/span&gt;&lt;br/&gt;185,9 тыс. аварий в сетях ХВС\"/>\n" +
    "                        <area shape=\"rect\" coords=\"300,196,355,152\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2008 г.&lt;/span&gt;&lt;br/&gt;44,6 тыс. аварий канализации\"/>\n" +
    "                        <area shape=\"rect\" coords=\"300,151,355,110\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2008 г.&lt;/span&gt;&lt;br/&gt;17,045 тыс. аварий на источниках теплоснабжения, паровых и тепловых сетях\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"359,443,413,220\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2009 г.&lt;/span&gt;&lt;br/&gt;164,5 тыс. аварий в сетях ХВС\"/>\n" +
    "                        <area shape=\"rect\" coords=\"359,220,413,171\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2009 г.&lt;/span&gt;&lt;br/&gt;39,4 тыс. аварий канализации\"/>\n" +
    "                        <area shape=\"rect\" coords=\"359,170,413,151\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2009 г.&lt;/span&gt;&lt;br/&gt;12,943 тыс. аварий на источниках теплоснабжения, паровых и тепловых сетях\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"417,443,472,210\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2010 г.&lt;/span&gt;&lt;br/&gt;170 тыс. аварий в сетях ХВС\"/>\n" +
    "                        <area shape=\"rect\" coords=\"417,209,472,167\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2010 г.&lt;/span&gt;&lt;br/&gt;39,5 тыс. аварий канализации\"/>\n" +
    "                        <area shape=\"rect\" coords=\"417,166,472,143\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2010 г.&lt;/span&gt;&lt;br/&gt;14,584 тыс. аварий на источниках теплоснабжения, паровых и тепловых сетях\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"477,443,531,232\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2011 г.&lt;/span&gt;&lt;br/&gt;154,6 тыс. аварий в сетях ХВС\"/>\n" +
    "                        <area shape=\"rect\" coords=\"477,231,531,182\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2011 г.&lt;/span&gt;&lt;br/&gt;35,8 тыс. аварий канализации\"/>\n" +
    "                        <area shape=\"rect\" coords=\"477,182,531,172\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2011 г.&lt;/span&gt;&lt;br/&gt;10,660 тыс. аварий на источниках теплоснабжения, паровых и тепловых сетях\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"535,442,590,253\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2012 г.&lt;/span&gt;&lt;br/&gt;142,9 тыс. аварий в сетях ХВС\"/>\n" +
    "                        <area shape=\"rect\" coords=\"535,253,590,203\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2012 г.&lt;/span&gt;&lt;br/&gt;34 тыс. аварий канализации\"/>\n" +
    "                        <area shape=\"rect\" coords=\"535,203,590,192\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2012 г.&lt;/span&gt;&lt;br/&gt;9,397 тыс. аварий на источниках теплоснабжения, паровых и тепловых сетях\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"594,443,649,301\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2013 г.&lt;/span&gt;&lt;br/&gt;109,1 тыс. аварий в сетях ХВС\"/>\n" +
    "                        <area shape=\"rect\" coords=\"594,300,649,252\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2013 г.&lt;/span&gt;&lt;br/&gt;31,6 тыс. аварий канализации\"/>\n" +
    "                        <area shape=\"rect\" coords=\"594,252,649,243\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2013 г.&lt;/span&gt;&lt;br/&gt;8,082 тыс. аварий на источниках теплоснабжения, паровых и тепловых сетях\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"653,443,708,303\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2014 г.&lt;/span&gt;&lt;br/&gt;106,8 тыс. аварий в сетях ХВС\"/>\n" +
    "                        <area shape=\"rect\" coords=\"653,303,708,264\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2014 г.&lt;/span&gt;&lt;br/&gt;27,6 тыс. аварий канализации\"/>\n" +
    "                        <area shape=\"rect\" coords=\"653,264,708,257\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2014 г.&lt;/span&gt;&lt;br/&gt;6,782 тыс. аварий на источниках теплоснабжения, паровых и тепловых сетях\"/>\n" +
    "\n" +
    "                        <area shape=\"rect\" coords=\"712,443,766,327\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2015 г.&lt;/span&gt;&lt;br/&gt;86,7 тыс. аварий в сетях ХВС\"/>\n" +
    "                        <area shape=\"rect\" coords=\"712,326,766,278\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2015 г.&lt;/span&gt;&lt;br/&gt;37,2 тыс. аварий канализации\"/>\n" +
    "                        <area shape=\"rect\" coords=\"712,277,766,270\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2015 г.&lt;/span&gt;&lt;br/&gt;5,794 тыс. аварий на источниках теплоснабжения, паровых и тепловых сетях\"/>\n" +
    "                    </map>\n" +
    "                </div>\n" +
    "            </slide>\n" +
    "            <slide class=\"rosstat-carousel-background\">\n" +
    "                <div class=\"info-panel__data info-panel__data_size_lg rosstat-item-box\">\n" +
    "                    <span class=\"info-panel__val info-panel__val_attn\" style=\"display: block;text-align: left;padding-left: 80px\">Доля сетей централизованного снабжения, нуждающихся в замене</span>\n" +
    "                    <img src=\"assets/img/rosstat/municipal-infrastructure/network.jpg\" class=\"rosstat-image\" usemap=\"#network\">\n" +
    "                    <map name=\"network\">\n" +
    "                        <area shape=\"poly\" coords=\"71,446,73,334,92,336,119,317,119,445\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1995 г.&lt;/span&gt;&lt;br/&gt;12,8% тепловых и паровых сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"73,331,73,287,92,286,118,244,120,314,93,334\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1995 г.&lt;/span&gt;&lt;br/&gt;18,5% канализационных сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"72,284,72,244,92,242,119,203,118,242,90,284\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;1995 г.&lt;/span&gt;&lt;br/&gt;23,1% сетей водоснабжения\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"122,446,122,315,141,302,170,291,170,445\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2000 г.&lt;/span&gt;&lt;br/&gt;16,2% тепловых и паровых сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"123,311,122,237,139,206,171,178,169,289\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2000 г.&lt;/span&gt;&lt;br/&gt;27,6% канализационных сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"122,231,121,198,143,170,170,141,169,175,140,202\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2000 г.&lt;/span&gt;&lt;br/&gt;31,6% сетей водоснабжения\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"172,446,171,289,194,281,221,246,223,445\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2004 г.&lt;/span&gt;&lt;br/&gt;19,3% тепловых и паровых сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"172,285,175,173,195,152,220,167,222,243,194,278\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2004 г.&lt;/span&gt;&lt;br/&gt;33% канализационных сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"172,173,172,138,193,115,219,117,221,165,200,154,191,149\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2004 г.&lt;/span&gt;&lt;br/&gt;37,8% сетей водоснабжения\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"226,446,224,246,243,223,269,223,273,446\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2005 г.&lt;/span&gt;&lt;br/&gt;25,2% тепловых и паровых сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"225,241,223,168,242,176,271,167,269,219,244,219,236,223\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2005 г.&lt;/span&gt;&lt;br/&gt;30,5% канализационных сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"227,166,223,114,243,115,271,108,272,164,243,174\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2005 г.&lt;/span&gt;&lt;br/&gt;37,7% сетей водоснабжения\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"275,446,272,222,317,221,321,444\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2006 г.&lt;/span&gt;&lt;br/&gt;25,3% тепловых и паровых сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"273,219,275,166,319,153,317,218\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2006 г.&lt;/span&gt;&lt;br/&gt;32,6% канализационных сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"275,162,273,107,320,95,319,148\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2006 г.&lt;/span&gt;&lt;br/&gt;39,1% сетей водоснабжения\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"324,447,320,220,371,216,370,448\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2007 г.&lt;/span&gt;&lt;br/&gt;25,9% тепловых и паровых сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"322,218,321,152,347,144,369,144,369,213\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2007 г.&lt;/span&gt;&lt;br/&gt;34,1% канализационных сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"323,150,324,94,369,86,371,142,342,139\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2007 г.&lt;/span&gt;&lt;br/&gt;40,5% сетей водоснабжения\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"374,446,374,218,422,213,421,446\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2008 г.&lt;/span&gt;&lt;br/&gt;26,2% тепловых и паровых сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"374,215,374,142,393,142,422,134,421,210\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2008 г.&lt;/span&gt;&lt;br/&gt;34,9% канализационных сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"373,139,373,85,419,76,421,130,392,138\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2008 г.&lt;/span&gt;&lt;br/&gt;41,9% сетей водоснабжения\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"423,446,426,211,445,210,471,205,470,446\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2009 г.&lt;/span&gt;&lt;br/&gt;26,7% тепловых и паровых сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"425,208,426,133,445,128,471,129,471,202,444,207\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2009 г.&lt;/span&gt;&lt;br/&gt;36% канализационных сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"424,130,423,75,443,71,470,71,471,126,442,126\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2009 г.&lt;/span&gt;&lt;br/&gt;42,5% сетей водоснабжения\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"474,446,474,202,493,198,520,198,522,445\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2010 г.&lt;/span&gt;&lt;br/&gt;28% тепловых и паровых сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"476,200,476,130,494,126,520,117,519,195,495,194\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2010 г.&lt;/span&gt;&lt;br/&gt;36,1% канализационных сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"474,126,475,70,496,66,521,66,519,114\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2010 г.&lt;/span&gt;&lt;br/&gt;42,8% сетей водоснабжения\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"526,446,524,196,545,193,571,193,575,446\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2011 г.&lt;/span&gt;&lt;br/&gt;28,6% тепловых и паровых сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"523,193,523,113,546,101,569,95,568,190\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2011 г.&lt;/span&gt;&lt;br/&gt;39,5% канализационных сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"523,110,523,66,542,66,569,65,570,92,545,96\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2011 г.&lt;/span&gt;&lt;br/&gt;43,8% сетей водоснабжения\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"578,444,574,191,598,190,619,194,620,446\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2012 г.&lt;/span&gt;&lt;br/&gt;29% тепловых и паровых сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"573,188,571,94,620,84,619,190,597,186\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2012 г.&lt;/span&gt;&lt;br/&gt;40,8% канализационных сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"575,91,573,62,596,62,618,61,620,81,594,84\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2012 г.&lt;/span&gt;&lt;br/&gt;43,8% сетей водоснабжения\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"623,446,623,192,647,192,671,194,668,446\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2013 г.&lt;/span&gt;&lt;br/&gt;28,6% тепловых и паровых сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"624,190,623,85,672,77,668,194\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2013 г.&lt;/span&gt;&lt;br/&gt;41,8% канализационных сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"623,82,624,59,643,54,672,55,671,72,647,81\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2013 г.&lt;/span&gt;&lt;br/&gt;44,2% сетей водоснабжения\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"671,447,675,193,720,192,719,446\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2014 г.&lt;/span&gt;&lt;br/&gt;28,9% тепловых и паровых сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"672,190,675,76,717,69,719,190\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2014 г.&lt;/span&gt;&lt;br/&gt;42,7% канализационных сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"675,74,677,56,692,56,715,66\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2014 г.&lt;/span&gt;&lt;br/&gt;44,2% сетей водоснабжения\"/>\n" +
    "\n" +
    "                        <area shape=\"poly\" coords=\"721,446,723,192,765,191,766,448\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2015 г.&lt;/span&gt;&lt;br/&gt;29,1% тепловых и паровых сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"721,193,743,192,766,190,764,78,743,79,723,70\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2015 г.&lt;/span&gt;&lt;br/&gt;43,6% канализационных сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"764,75,764,66,743,66,730,68,759,76\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2015 г.&lt;/span&gt;&lt;br/&gt;43,6% канализационных сетей\"/>\n" +
    "                        <area shape=\"poly\" coords=\"725,67,742,77,752,75\"\n" +
    "                              hcs-following-tooltip=\"&lt;span class&#61;&quot;rosstat-14&quot;&gt;2015 г.&lt;/span&gt;&lt;br/&gt;42,3% сетей водоснабжения\"/>\n" +
    "                    </map>\n" +
    "                </div>\n" +
    "            </slide>\n" +
    "        </carousel>\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("main-forms/map/ef_poch_mapReg_vr.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("main-forms/map/ef_poch_mapReg_vr.tpl.html",
    "<div class=\"modal-base content-management\">\n" +
    "    <div class=\"modal-heading modal-base__header\">\n" +
    "        <ng-close-button ng-click=\"cancel()\"></ng-close-button>\n" +
    "        <h3 class=\"modal-base__header-title\">Выберите действие</h3>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"modal-body modal-base__body\">\n" +
    "        <div class=\"section-base text-center _margin-0 _bottom\">\n" +
    "            <div class=\"form-base\">\n" +
    "                <button class=\"btn btn-md btn_fn_lg btn-cancel\"  ng-click=\"cancel()\">Отменить</button>\n" +
    "                <button class=\"btn btn-md btn_fn_lg btn-action\" ng-click=\"selectOrganisation()\">Перейти в реестр поставщиков информации</button>\n" +
    "                <button class=\"btn btn-md btn_fn_lg btn-action\" ng-click=\"selectHome()\">Перейти в реестр жилищного фонда</button>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "\n" +
    "</div>");
}]);

angular.module("main-forms/map/map.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("main-forms/map/map.tpl.html",
    "<form-header page-title=\"pageTitle\" breadcrumbs=\"breadcrumbs\"></form-header>\n" +
    "<div class=\"registered-organization-statistics\" ng-mousemove=\"mousemove($event)\">\n" +
    "\n" +
    "    <div class=\"\" id=\"main\">\n" +
    "\n" +
    "        <div class=\"\"><!-- ng-include=\"&#39;blocks/content.tpl.html&#39;\">-->\n" +
    "            <!-- uiView: content -->\n" +
    "\n" +
    "            <div ui-view=\"content\">\n" +
    "                <div id=\"underMap\">\n" +
    "                    <span class=\"desc-date\">Данные по состоянию на {{currentDate() | date: 'dd.MM.yyyy'}}</span>\n" +
    "                    <table class=\"mapTable\">\n" +
    "                        <tbody>\n" +
    "                        <tr>\n" +
    "                            <td class=\"legend\">\n" +
    "                                <div class=\"\" ng-show=\"dumpOfRogStatics\">\n" +
    "                                    <div class=\"legendHead\">\n" +
    "                                        <div class=\"overMapText\">\n" +
    "                                            <ul class=\"app-map-header\">\n" +
    "                                                <li><h3 class=\"roboto _margin-30 _bottom\">Вами выбраны:</h3></li>\n" +
    "                                                <li class=\"desc-companies row\" ng-show=\"model.enableOrgFilter\">\n" +
    "                                                    <div class=\"col-xs-2 form-base__control-label_wd_auto _padding-0 _right\">\n" +
    "                                                        <img src=\"assets/img/org-stat-header-icon.png\" alt=\"\"/>\n" +
    "                                                    </div>\n" +
    "                                                    <div class=\"col-xs-1 form-base__control-label_wd_auto\">\n" +
    "                                                        <span>{{numberOfRealOrganizations}}</span>\n" +
    "                                                    </div>\n" +
    "                                                    <div class=\"col-xs-6 _padding-0 _left form-base__control-label_wd_auto\">\n" +
    "                                                        <h3 class=\"roboto _padding-15 _top _right \">\n" +
    "                                                            {{numberOfRealOrganizations|organizationFilter:true:false:true}}\n" +
    "                                                        </h3>\n" +
    "                                                    </div>\n" +
    "                                                </li>\n" +
    "                                                <li class=\"desc-companies row\"\n" +
    "                                                    ng-show=\"getEnableApartmentHouseStatics()\">\n" +
    "                                                    <div class=\"col-xs-2 form-base__control-label_wd_auto _padding-10 _right\">\n" +
    "                                                        <img src=\"assets/img/mkd-stat-header-icon.png\" alt=\"\"/>\n" +
    "                                                    </div>\n" +
    "                                                    <div class=\"col-xs-1 form-base__control-label_wd_auto\">\n" +
    "                                                        {{numberOfManagementHouse}}\n" +
    "                                                    </div>\n" +
    "                                                    <div class=\"col-xs-6 _padding-0 _left form-base__control-label_wd_auto\">\n" +
    "                                                        <h3 class=\"roboto _padding-5 _top _right\"\n" +
    "                                                            ng-bind-html=\"numberOfManagementHouse|houseAndOrganizationFilter:false:true:true\">\n" +
    "                                                        </h3>\n" +
    "                                                    </div>\n" +
    "                                                </li>\n" +
    "                                                <li class=\"desc-companies row\" ng-show=\"model.managementHouseJD\">\n" +
    "                                                    <div class=\"col-xs-2 form-base__control-label_wd_auto _padding-0 _right\">\n" +
    "                                                        <img src=\"assets/img/JD-stat-header-icon.png\" alt=\"\"/>\n" +
    "                                                    </div>\n" +
    "                                                    <div class=\"col-xs-1 form-base__control-label_wd_auto\">\n" +
    "                                                        {{numberOfJDHouse}}\n" +
    "                                                    </div>\n" +
    "                                                    <div class=\"col-xs-6 _padding-0 _left form-base__control-label_wd_auto\">\n" +
    "                                                        <h3 class=\"roboto _padding-15 _top _right\">\n" +
    "                                                            {{numberOfJDHouse|houseAndOrganizationFilter:false:false}}\n" +
    "                                                        </h3>\n" +
    "                                                    </div>\n" +
    "                                                </li>\n" +
    "                                            </ul>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                            </td>\n" +
    "                            <td class=\"legend\" id=\"count_in_system\">\n" +
    "                                <div ng-show=\"dumpOfRogStatics\">\n" +
    "                                    <div class=\"legendHead\">\n" +
    "                                        <div class=\"overMapText\">\n" +
    "                                            <ul class=\"app-map-header\">\n" +
    "                                                <li><h3 class=\"roboto _margin-30 _bottom\">Всего в системе:</h3></li>\n" +
    "                                                <li class=\"desc-companies row\" ng-show=\"model.enableOrgFilter\">\n" +
    "                                                    <div class=\"col-xs-1 _padding-7 _top form-base__control-label_wd_auto\">\n" +
    "                                                        {{totalOrgCountInSystem}}\n" +
    "                                                    </div>\n" +
    "                                                    <div class=\"col-xs-6 _padding-0 _left\">\n" +
    "                                                        <h3 class=\"roboto  _padding-7 _top\"\n" +
    "                                                            ng-bind-html=\"totalOrgCountInSystem|houseAndOrganizationFilter:true:false:true\">\n" +
    "                                                        </h3>\n" +
    "                                                    </div>\n" +
    "                                                </li>\n" +
    "                                                <li class=\"desc-companies row\"\n" +
    "                                                    ng-show=\"getEnableApartmentHouseStatics()\">\n" +
    "                                                    <div class=\"col-xs-1  _padding-7 _top form-base__control-label_wd_auto\">\n" +
    "                                                        {{totalMKDCountInSystem}}\n" +
    "                                                    </div>\n" +
    "                                                    <div class=\"col-xs-6 _padding-0 _left\">\n" +
    "                                                        <h3 class=\"roboto  _padding-15 _top\">\n" +
    "                                                            {{totalMKDCountInSystem|houseAndOrganizationFilter:false:true}}\n" +
    "                                                        </h3>\n" +
    "                                                    </div>\n" +
    "                                                </li>\n" +
    "                                                <li class=\"desc-companies row\" ng-show=\"model.managementHouseJD\">\n" +
    "                                                    <div class=\"col-xs-1  _padding-7 _top form-base__control-label_wd_auto\">\n" +
    "                                                        {{totalJDCountInSystem}}\n" +
    "                                                    </div>\n" +
    "                                                    <div class=\"col-xs-6 _padding-0 _left\">\n" +
    "                                                        <h3 class=\"roboto  _padding-15 _top\">\n" +
    "                                                            {{totalJDCountInSystem|houseAndOrganizationFilter:false:false}}\n" +
    "                                                        </h3>\n" +
    "                                                    </div>\n" +
    "                                                </li>\n" +
    "                                            </ul>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                            </td>\n" +
    "                        </tr>\n" +
    "                        </tbody>\n" +
    "                    </table>\n" +
    "                    <table class=\"mapTable _margin-0 _top\">\n" +
    "                        <tbody>\n" +
    "                        <tr>\n" +
    "                            <td class=\"legend\">\n" +
    "                                <div class=\"pull-left\" id=\"\" ng-show=\"dumpOfRogStatics\">\n" +
    "                                    <ul class=\"legend\">\n" +
    "                                        <li ng-if=\"!limitProcent\">\n" +
    "                                            <span class=\"legendIco lico6\"></span>\n" +
    "                                            <span class=\"legendTxt\" style=\"width: 200px;\">количество зарегистрированных организаций превышает плановое</span>\n" +
    "                                        </li>\n" +
    "                                        <li>\n" +
    "                                            <span class=\"legendIco lico5\"></span>\n" +
    "                                            <span class=\"legendTxt\">75 - 100%</span>\n" +
    "                                        </li>\n" +
    "                                        <li>\n" +
    "                                            <span class=\"legendIco lico4\"></span>\n" +
    "                                            <span class=\"legendTxt\">50 - 75%</span>\n" +
    "                                        </li>\n" +
    "                                        <li>\n" +
    "                                            <span class=\"lico3 legendIco\"></span>\n" +
    "                                            <span class=\"legendTxt\">25 - 50%</span>\n" +
    "                                        </li>\n" +
    "                                        <li>\n" +
    "                                            <span class=\"legendIco lico2\"></span>\n" +
    "                                            <span class=\"legendTxt\">0 - 25%</span>\n" +
    "                                        </li>\n" +
    "                                        <li>\n" +
    "                                            <span class=\"legendIco lico1\"></span>\n" +
    "                                            <span class=\"legendTxt\">Ни одного объекта</span>\n" +
    "                                        </li>\n" +
    "                                        <li>\n" +
    "                                            <span class=\"legendIco lico0\"></span>\n" +
    "                                            <span class=\"legendTxt0\">Нет данных по плановому количеству выбранных объектов</span>\n" +
    "                                        </li>\n" +
    "                                    </ul>\n" +
    "                                </div>\n" +
    "                            </td>\n" +
    "                            <td>\n" +
    "                                <div id=\"mainMap\" ng-init=\"initMap()\"></div>\n" +
    "                            </td>\n" +
    "                        </tr>\n" +
    "                        </tbody>\n" +
    "                    </table>\n" +
    "                    <div class=\"collapse-toggle collapse-toggle-bp\">\n" +
    "                        <form class=\"form-horizontal form-horizontal_search\">\n" +
    "                            <div class=\"collapse-toggle__cnt collapse in\" collapse=\"expanded\"\n" +
    "                                 style=\"height: auto;\">\n" +
    "                                <div class=\"collapse-toggle__cnt-wrapper\">\n" +
    "                                    <div class=\"form-base\">\n" +
    "                                        <div class=\"form-base__body form-base__body_multi form-base__container_multi form-base_round_t form-base_pad_light b-adj_pd-b_xxs_double\">\n" +
    "                                            <div class=\"row  form-base__row_multi\">\n" +
    "                                                <div class=\"col-xs-12 form-base_pad_light form-base__col form-base__col_multi _padding-7 _bottom\">\n" +
    "\n" +
    "                                                    <div class=\"form-group form-base__form-group _margin-0 _bottom \">\n" +
    "                                                        <div class=\" col-xs-2\">\n" +
    "                                                            <label>Отображать на <br/> карте\n" +
    "                                                                статистику:</label>\n" +
    "                                                        </div>\n" +
    "                                                        <div class=\"col-xs-4\">\n" +
    "                                                            <div class=\"form-group form-base__form-group\">\n" +
    "                                                                <div class=\"checkbox _margin-0 _top\">\n" +
    "                                                                    <label>\n" +
    "                                                                        <input\n" +
    "                                                                                type=\"checkbox\"\n" +
    "                                                                                ng-model=\"model.enableOrgFilter\"\n" +
    "                                                                                ng-change=\"changeOrgFilter(true)\"/>\n" +
    "                                                                        <b>по организациям</b>\n" +
    "                                                                    </label>\n" +
    "                                                                </div>\n" +
    "                                                            </div>\n" +
    "                                                            <div class=\"form-group form-base__form-group  _margin-15 _padding-12 _top\">\n" +
    "                                                                <div class=\"col-xs-12 _padding-0 _left\"\n" +
    "                                                                     ng-show=\"model.enableOrgFilter || openedOrganizationRolePopup\"\n" +
    "                                                                     ng-if=\"organizationRoles\">\n" +
    "                                                                    <multiselecttree multiple=\"true\"\n" +
    "                                                                                     name=\"organizationFilter\"\n" +
    "                                                                                     ng-model=\"model.organizationFilter\"\n" +
    "                                                                                     options=\"role.organizationRoleName for role in organizationRoles\"\n" +
    "                                                                                     header=\"getOrganizationFilterText()\"\n" +
    "                                                                                     all-select-ability=\"true\"\n" +
    "                                                                                     trigger=\"organizationRolePopupTrigger()\"\n" +
    "                                                                                     change=\"changeOrgFilter()\"\n" +
    "                                                                                     expanded=\"true\"\n" +
    "                                                                                     hide-caret=\"true\"\n" +
    "                                                                                     disable-parent-checkbox=\"true\"\n" +
    "                                                                                     forMapRegistaraion = \"true\"\n" +
    "                                                                    />\n" +
    "                                                                </div>\n" +
    "                                                            </div>\n" +
    "                                                            <!--div class=\"form-group form-base__form-group\"\n" +
    "                                                                 ng-if=\"organizationRoles && model.enableManagementOrgTypeFilter\">\n" +
    "                                                                <div class=\"checkbox\">\n" +
    "                                                                    <label>\n" +
    "                                                                        <input\n" +
    "                                                                                type=\"checkbox\"\n" +
    "                                                                                ng-model=\"model.managementOrgUK\"\n" +
    "                                                                                ng-change=\"changeManagementOrgTypeFilter()\"/>Управляющая организация\n" +
    "                                                                    </label>\n" +
    "                                                                </div>\n" +
    "                                                            </div>\n" +
    "                                                            <div class=\"form-group form-base__form-group\"\n" +
    "                                                                 ng-if=\"organizationRoles && model.enableManagementOrgTypeFilter\">\n" +
    "                                                                <div class=\"checkbox\">\n" +
    "                                                                    <label>\n" +
    "                                                                        <input\n" +
    "                                                                                type=\"checkbox\"\n" +
    "                                                                                ng-model=\"model.managementOrgTSJ\"\n" +
    "                                                                                ng-change=\"changeManagementOrgTypeFilter()\"/>ТСЖ\n" +
    "                                                                    </label>\n" +
    "                                                                </div>\n" +
    "\n" +
    "                                                            </div>\n" +
    "                                                            <div class=\"form-group form-base__form-group \"\n" +
    "                                                                 ng-if=\"organizationRoles && model.enableManagementOrgTypeFilter\">\n" +
    "                                                                <div class=\"checkbox\">\n" +
    "                                                                    <label>\n" +
    "                                                                        <input\n" +
    "                                                                                type=\"checkbox\"\n" +
    "                                                                                ng-model=\"model.managementOrgJK\"\n" +
    "                                                                                ng-change=\"changeManagementOrgTypeFilter()\"/>ЖК,\n" +
    "                                                                        ЖСК и иной кооператив\n" +
    "                                                                    </label>\n" +
    "                                                                </div>\n" +
    "                                                            </div-->\n" +
    "                                                        </div>\n" +
    "                                                        <div class=\"col-xs-4\">\n" +
    "                                                            <div class=\"form-group form-base__form-group\">\n" +
    "                                                                <div class=\"checkbox _margin-0 _top\">\n" +
    "                                                                    <label>\n" +
    "                                                                        <input\n" +
    "                                                                                type=\"checkbox\"\n" +
    "                                                                                ng-change=\"changeManagementHouseTypeFilter(true)\"\n" +
    "                                                                                ng-model=\"model.enableManagementHouseTypeFilter\"/>\n" +
    "                                                                        <b>по многоквартирным домам в разрезе <br/> способов управления</b>\n" +
    "                                                                    </label>\n" +
    "                                                                </div>\n" +
    "                                                            </div>\n" +
    "                                                            <div class=\"form-group form-base__form-group\" ng-hide=\"!model.enableManagementHouseTypeFilter\">\n" +
    "                                                                <multiselecttree multiple=\"true\"\n" +
    "                                                                                 ng-model=\"model.managementHouseSelected\"\n" +
    "                                                                                 all-select-ability=\"true\"\n" +
    "                                                                                 options=\"c.name for c in managementHouses\"\n" +
    "                                                                                 change=\"changeManagementHouseTypeFilter()\"\n" +
    "                                                                                 header=\"getApartmentHouseFilterText()\"\n" +
    "                                                                                 forMapRegistaraion = \"true\"\n" +
    "                                                                                 disabled=\"!model.enableManagementHouseTypeFilter\"\n" +
    "                                                                />\n" +
    "                                                            </div>\n" +
    "\n" +
    "                                                            <!--div class=\"form-group form-base__form-group _padding-20 _left\"\n" +
    "                                                                 ng-if=\"model.enableManagementHouseTypeFilter\">\n" +
    "                                                                <div class=\"checkbox\">\n" +
    "                                                                    <label>\n" +
    "                                                                        <input\n" +
    "                                                                                type=\"checkbox\"\n" +
    "                                                                                ng-change=\"changeManagementHouseTypeFilter()\"\n" +
    "                                                                                ng-model=\"model.managementHouseByDirectControl\"/>\n" +
    "                                                                        Непосредственное управление\n" +
    "                                                                    </label>\n" +
    "                                                                </div>\n" +
    "                                                            </div>\n" +
    "                                                            <div class=\"form-group form-base__form-group _padding-20 _left\"\n" +
    "                                                                 ng-if=\"model.enableManagementHouseTypeFilter\">\n" +
    "                                                                <div class=\"checkbox\">\n" +
    "                                                                    <label>\n" +
    "                                                                        <input\n" +
    "                                                                                type=\"checkbox\"\n" +
    "                                                                                ng-change=\"changeManagementHouseTypeFilter()\"\n" +
    "                                                                                ng-model=\"model.managementHouseByManagementOrganization\"/>\n" +
    "                                                                        Управляющая организация\n" +
    "                                                                    </label>\n" +
    "                                                                </div>\n" +
    "                                                            </div>\n" +
    "                                                            <div class=\"form-group form-base__form-group _padding-20 _left\"\n" +
    "                                                                 ng-if=\"model.enableManagementHouseTypeFilter\">\n" +
    "                                                                <div class=\"checkbox\">\n" +
    "                                                                    <label>\n" +
    "                                                                        <input type=\"checkbox\"\n" +
    "                                                                               ng-change=\"changeManagementHouseTypeFilter()\"\n" +
    "                                                                               ng-model=\"model.managementHouseByManagementCooperative\"/>\n" +
    "                                                                        ТСЖ, ЖСК, ЖК, иной кооператив\n" +
    "                                                                    </label>\n" +
    "                                                                </div>\n" +
    "                                                            </div>\n" +
    "                                                            <div class=\"form-group form-base__form-group _padding-20 _left\"\n" +
    "                                                                 ng-if=\"model.enableManagementHouseTypeFilter\">\n" +
    "                                                                <div class=\"checkbox\">\n" +
    "                                                                    <label>\n" +
    "                                                                        <input\n" +
    "                                                                                type=\"checkbox\"\n" +
    "                                                                                ng-change=\"changeManagementHouseTypeFilter()\"\n" +
    "                                                                                ng-model=\"model.managementHouseByAnotherWay\"/>\n" +
    "                                                                        Способ управления не выбран или не реализован\n" +
    "                                                                    </label>\n" +
    "                                                                </div>\n" +
    "                                                            </div>\n" +
    "                                                            <div class=\"form-group form-base__form-group _padding-20 _left\"\n" +
    "                                                                 ng-if=\"model.enableManagementHouseTypeFilter\">\n" +
    "                                                                <div class=\"checkbox\">\n" +
    "                                                                    <label>\n" +
    "                                                                        <input\n" +
    "                                                                                type=\"checkbox\"\n" +
    "                                                                                ng-change=\"changeManagementHouseTypeFilter()\"\n" +
    "                                                                                ng-model=\"model.managementHouseByUnknown\"/>\n" +
    "                                                                        Информация о способе управления не размещена в\n" +
    "                                                                        системе\n" +
    "                                                                    </label>\n" +
    "                                                                </div>\n" +
    "                                                            </div-->\n" +
    "\n" +
    "                                                        </div>\n" +
    "                                                        <div class=\"col-xs-3\">\n" +
    "                                                            <div class=\"form-group form-base__form-group _padding-30 _left\">\n" +
    "                                                                <div class=\"checkbox _margin-0 _top\">\n" +
    "                                                                    <label>\n" +
    "                                                                        <input\n" +
    "                                                                                type=\"checkbox\"\n" +
    "                                                                                ng-change=\"changeManagementHouseTypeFilter(true)\"\n" +
    "                                                                                ng-model=\"model.managementHouseJD\"/>\n" +
    "                                                                        <b>по жилым домам, включая блокированную\n" +
    "                                                                            застройку</b>\n" +
    "                                                                    </label>\n" +
    "                                                                </div>\n" +
    "                                                            </div>\n" +
    "                                                        </div>\n" +
    "                                                    </div>\n" +
    "                                                </div>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                            <div class=\"collapse-toggle__pane collapse-toggle__pane_utility fix-ef-bp\">\n" +
    "                                <div class=\"row\">\n" +
    "                                    <div class=\"col-xs-4\">\n" +
    "                                        <a href=\"\"\n" +
    "                                           class=\"collapse-toggle__ctr collapse-toggle__ctr_utility b-adj_mg-t_xs\"\n" +
    "                                           ng-class=\"{'_collapsed' : expanded}\"\n" +
    "                                           ng-click=\"expanded = !expanded\">\n" +
    "                                                                <span class=\"collapse-toggle__state _collapsed\">\n" +
    "                                                                    <span class=\"collapse-toggle__state-icon collapse-toggle__state-icon_card  glyphicon whhg-circledown\">\n" +
    "\n" +
    "                                                                    </span>\n" +
    "                                                                    <span class=\"collapse-toggle__state-title collapse-toggle__state-title_utility\">Развернуть поиск</span>\n" +
    "                                                                </span>\n" +
    "                                            <span class=\"collapse-toggle__state _active\">\n" +
    "                                                                    <span class=\"collapse-toggle__state-icon collapse-toggle__state-icon_card  glyphicon whhg-circleup\"></span>\n" +
    "                                                                    <span class=\"collapse-toggle__state-title collapse-toggle__state-title_utility\">Свернуть поиск</span>\n" +
    "                                                                </span>\n" +
    "                                        </a>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                                <!-- /end .row -->\n" +
    "                            </div>\n" +
    "                        </form>\n" +
    "                    </div>\n" +
    "\n" +
    "                </div>\n" +
    "\n" +
    "\n" +
    "                <div class=\"hcs-public-map-data-block col-xs-12\">\n" +
    "                    <div class=\"row\">\n" +
    "                        <div class=\"\">\n" +
    "                            <table class=\"registry-map-result-table table-entity\" id=\"reg-table\"\n" +
    "                                   ng-if=\"model.enableOrgFilter || getEnableApartmentHouseStatics() || model.managementHouseJD\">\n" +
    "                                <thead>\n" +
    "                                <tr>\n" +
    "                                    <th class=\"cell-center\" style=\"min-width: 36px;\">№</th>\n" +
    "                                    <th class=\"cell-center\" colspan=\"2\" style=\"min-width: 354px;max-width: 354px;\">\n" +
    "                                        Субъект Российской Федерации\n" +
    "                                    </th>\n" +
    "                                    <th colspan=\"9\" class=\"_padding-0 _full\">\n" +
    "                                        <div id=\"headDiv\" style=\"max-width: 776px; width: auto; overflow: auto;\">\n" +
    "                                            <table id=\"headTable\" class=\"head-table\">\n" +
    "                                                <th class=\"cell-center \" data-sort=\"{{sortedDirect}}\"\n" +
    "                                                    style=\"min-width: 182px\"\n" +
    "                                                    ng-class=\"{onsorted: sortedField == 'plan'}\"\n" +
    "                                                    ng-click=\"clickSort('plan')\"\n" +
    "                                                    ng-if=\"numberOfPlanOrganizations > 0 && model.enableOrgFilter\">\n" +
    "                                                    <div>Организаций <br/> всего (план)*\n" +
    "                                                        <span title=\"Организации, осуществляющие в субъекте РФ несколько функций, учитываются в расчете по количеству функций, которые они осуществляют\"\n" +
    "                                                              class=\"gis-icon gis-icon_cl_prime glyphicon whhg-question-sign gray-color-title\"></span>\n" +
    "                                                    </div>\n" +
    "                                                </th>\n" +
    "                                                <th class=\"cell-center \" data-sort=\"{{sortedDirect}}\"\n" +
    "                                                    ng-if=\"model.enableOrgFilter\"\n" +
    "                                                    ng-class=\"{onsorted: sortedField == 'real'}\"\n" +
    "                                                    style=\"min-width: 182px\"\n" +
    "                                                    ng-click=\"clickSort('real')\">\n" +
    "                                                    <div>Зарегистрированных <br/> организаций\n" +
    "                                                        (факт)\n" +
    "                                                        <span title=\"Указывается количество организаций, зарегистрированных в ГИС ЖКХ и осуществляющих деятельность на данной территории. Организации, осуществляющие в субъекте РФ несколько функций, учитываются в расчете по количеству функций, которые они осуществляют\"\n" +
    "                                                              class=\"gis-icon gis-icon_cl_prime glyphicon whhg-question-sign gray-color-title\"></span>\n" +
    "                                                    </div>\n" +
    "\n" +
    "                                                </th>\n" +
    "                                                <th class=\"cell-center\" data-sort=\"{{sortedDirect}}\"\n" +
    "                                                    ng-class=\"{onsorted: sortedField == 'planOrgPercentage'}\"\n" +
    "                                                    ng-click=\"clickSort('planOrgPercentage')\"\n" +
    "                                                    style=\"min-width: 180px; background-position-x: 98%; padding-right: 10px\"\n" +
    "                                                    ng-if=\"model.enableOrgFilter\">\n" +
    "                                                    <div>\n" +
    "                                                        Зарегистрированных организаций (%)\n" +
    "                                                    </div>\n" +
    "                                                </th>\n" +
    "\n" +
    "                                                <th class=\"cell-center\" data-sort=\"{{sortedDirect}}\"\n" +
    "                                                    ng-if=\"getEnableApartmentHouseStatics() && !isEmptyPlanOfManagementHouse()\"\n" +
    "                                                    ng-class=\"{onsorted: sortedField == 'planManagementHouseTable' && childField == '8'}\"\n" +
    "                                                    style=\"min-width: 160px\"\n" +
    "                                                    ng-click=\"clickSort('planManagementHouseTable', 8)\">\n" +
    "                                                    <div>\n" +
    "                                                        Многоквартирных домов в субъекте РФ (план)*\n" +
    "                                                    </div>\n" +
    "                                                </th>\n" +
    "                                                <th class=\"cell-center\" data-sort=\"{{sortedDirect}}\"\n" +
    "                                                    ng-if=\"getEnableApartmentHouseStatics()\"\n" +
    "                                                    ng-class=\"{onsorted: sortedField == 'managementHouseTable'&& childField == '8'}\"\n" +
    "                                                    style=\"min-width: 160px;\"\n" +
    "                                                    ng-click=\"clickSort('managementHouseTable', 8)\">\n" +
    "                                                    <div>\n" +
    "                                                        Многоквартирных домов в системе (факт)\n" +
    "                                                    </div>\n" +
    "                                                </th>\n" +
    "                                                <th class=\"cell-center\" data-sort=\"{{sortedDirect}}\"\n" +
    "                                                    ng-if=\"getEnableApartmentHouseStatics() && !isEmptyPlanOfManagementHouse()\"\n" +
    "                                                    ng-class=\"{onsorted: sortedField == 'planManagementHousePercent'&& childField == '8'}\"\n" +
    "                                                    style=\"min-width: 160px;  background-position-x: 98%; padding-right: 10px\"\n" +
    "                                                    ng-click=\"clickSort('planManagementHousePercent', 8)\">\n" +
    "                                                    <div>\n" +
    "                                                        Многоквартирных домов в системе (%)\n" +
    "                                                    </div>\n" +
    "                                                </th>\n" +
    "\n" +
    "                                                <th class=\"cell-center\" data-sort=\"{{sortedDirect}}\"\n" +
    "                                                    ng-if=\"model.managementHouseJD\"\n" +
    "                                                    ng-class=\"{onsorted: sortedField == 'planManagementHouseTable'&& childField == '7'}\"\n" +
    "                                                    style=\"min-width: 160px\"\n" +
    "                                                    ng-click=\"clickSort('planManagementHouseTable', 7)\">\n" +
    "                                                    <div>\n" +
    "                                                        Жилых домов в субъекте РФ (план)*\n" +
    "                                                        <span title=\"Указаны с учетом блокированной застройки\"\n" +
    "                                                              class=\"gis-icon gis-icon_cl_prime glyphicon whhg-question-sign gray-color-title\"></span>\n" +
    "                                                    </div>\n" +
    "                                                </th>\n" +
    "                                                <th class=\"cell-center\" data-sort=\"{{sortedDirect}}\"\n" +
    "                                                    ng-if=\"model.managementHouseJD\"\n" +
    "                                                    ng-class=\"{onsorted: sortedField == 'managementHouseTable'&& childField == '7'}\"\n" +
    "                                                    style=\"min-width: 160px\"\n" +
    "                                                    ng-click=\"clickSort('managementHouseTable', 7)\">\n" +
    "                                                    <div>\n" +
    "                                                        Жилых домов в системе (факт)\n" +
    "                                                        <span title=\"Указаны с учетом блокированной застройки\"\n" +
    "                                                              class=\"gis-icon gis-icon_cl_prime glyphicon whhg-question-sign gray-color-title\"></span>\n" +
    "                                                    </div>\n" +
    "                                                </th>\n" +
    "                                                <th class=\"cell-center\" data-sort=\"{{sortedDirect}}\"\n" +
    "                                                    ng-if=\"model.managementHouseJD\"\n" +
    "                                                    ng-class=\"{onsorted: sortedField == 'planManagementHousePercent'&& childField == '7'}\"\n" +
    "                                                    style=\"min-width: 160px;  background-position-x: 95%; padding-right: 10px\"\n" +
    "                                                    ng-click=\"clickSort('planManagementHousePercent', 7)\">\n" +
    "                                                    <div>\n" +
    "                                                        Жилых домов в системе (%)\n" +
    "                                                    </div>\n" +
    "                                                </th>\n" +
    "                                            </table>\n" +
    "                                        </div>\n" +
    "                                    </th>\n" +
    "                                </tr>\n" +
    "                                </thead>\n" +
    "                                <tbody>\n" +
    "                                <tr>\n" +
    "                                    <td class=\"_padding-0 _full no-border _left\" colspan=\"3\" rowspan=\"87\">\n" +
    "                                        <div>\n" +
    "                                            <table id=\"body-table-1\" class=\" no-border _right\">\n" +
    "                                                <tr ng-show=\"isSelectFilteredOrganization\">\n" +
    "                                                    <td colspan=\"2\" class=\" no-border _top\"\n" +
    "                                                        ng-class=\"{'clear-height': !isSelectFilteredOrganization}\">\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"no-border _right _top\"\n" +
    "                                                        ng-class=\"{'clear-height': !isSelectFilteredOrganization}\">\n" +
    "                                                        <span>Организации и органы, осуществляющие свои функции на территории всей РФ</span>\n" +
    "                                                    </td>\n" +
    "                                                </tr>\n" +
    "                                                <tr ng-repeat=\"region in getDataWithPagination()\">\n" +
    "                                                    <td style=\"min-width: 36px\"\n" +
    "                                                        class=\"cell-center no-border _top dark-cell\">\n" +
    "                                                        {{(pagination.paginationConfig.page - 1) *\n" +
    "                                                        pagination.paginationConfig.itemsPerPage + $index + 1}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _right _top\" width=\"35px\"><span\n" +
    "                                                            class=\"ico {{getClassOfOrgPercentage(region)}}\"></span></td>\n" +
    "                                                    <td class=\"no-border _right _top _left\"\n" +
    "                                                        style=\"min-width: 302px;max-width: 302px;\">\n" +
    "                                                        <a ng-click=\"onClickRegion(region)\">{{region.name}}</a>\n" +
    "                                                    </td>\n" +
    "                                                </tr>\n" +
    "                                                <tr>\n" +
    "                                                    <td></td>\n" +
    "                                                    <td colspan=\"2\" style=\"padding-left: 15px;\">Итого</td>\n" +
    "                                                </tr>\n" +
    "                                            </table>\n" +
    "                                        </div>\n" +
    "                                    </td>\n" +
    "                                    <td class=\"_padding-0 _full no-border _left\" colspan=\"9\" rowspan=\"87\">\n" +
    "                                        <div class=\"body-div\"\n" +
    "                                             style=\"max-width: 761px; width: auto; overflow: hidden;\">\n" +
    "                                            <table class=\"table table-entity body-table-org-map  no-border _left _top\">\n" +
    "                                                <tr ng-show=\"isSelectFilteredOrganization\">\n" +
    "                                                    <td class=\"cell-center  no-border _left _top\"\n" +
    "                                                        ng-if=\"numberOfPlanOrganizations > 0 && model.enableOrgFilter \">\n" +
    "                                                        {{federalRegion.plan > 0 ? federalRegion.plan >=\n" +
    "                                                        federalRegion.real ?\n" +
    "                                                        federalRegion.plan: federalRegion.real : '-'}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\"\n" +
    "                                                        ng-if=\"model.enableOrgFilter\">\n" +
    "                                                        {{federalRegion.real}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\"\n" +
    "                                                        ng-if=\"numberOfPlanOrganizations > 0 && model.enableOrgFilter\">\n" +
    "                                                        {{federalRegion.plan\n" +
    "                                                        !== 0 ? formatPercentage(federalRegion.planOrgPercentage) +\n" +
    "                                                        '%' : '-'}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\"\n" +
    "                                                        ng-if=\"getEnableApartmentHouseStatics() && federalRegion && !isEmptyPlanOfManagementHouse()\">\n" +
    "                                                        {{federalRegion.planManagementHouseTable.8 > 0 ?\n" +
    "                                                        federalRegion.planManagementHouseTable.8 : '-'}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\"\n" +
    "                                                        ng-if=\"getEnableApartmentHouseStatics() && federalRegion\">\n" +
    "                                                        {{federalRegion.managementHouseTable.8}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\"\n" +
    "                                                        ng-if=\"getEnableApartmentHouseStatics() && federalRegion && !isEmptyPlanOfManagementHouse()\">\n" +
    "                                                        {{federalRegion.planManagementHousePercent.8 !== 0 ?\n" +
    "                                                        formatPercentage(federalRegion.planManagementHousePercent.8)\n" +
    "                                                        + '%' : '-'}}\n" +
    "                                                    </td>\n" +
    "\n" +
    "                                                    <td class=\"cell-center no-border _top\"\n" +
    "                                                        ng-if=\"model.managementHouseJD && numberOfPlanJDHouses>0 && federalRegion\">\n" +
    "                                                        {{federalRegion.planManagementHouseTable.7 > 0 ?\n" +
    "                                                        federalRegion.planManagementHouseTable.7 : '-'}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\"\n" +
    "                                                        ng-if=\"model.managementHouseJD && federalRegion\">\n" +
    "                                                        {{federalRegion.managementHouse.7}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\"\n" +
    "                                                        ng-if=\"model.managementHouseJD && federalRegion\">\n" +
    "                                                        {{federalRegion.planManagementHousePercent.7 !== 0 ?\n" +
    "                                                        formatPercentage(federalRegion.planManagementHousePercent.7)\n" +
    "                                                        + '%' : '-'}}\n" +
    "                                                    </td>\n" +
    "                                                </tr>\n" +
    "                                                <tr ng-repeat=\"region in getDataWithPagination()\">\n" +
    "\n" +
    "                                                    <td class=\"cell-center  no-border _left _top\"\n" +
    "                                                        style=\"min-width: 182px\"\n" +
    "                                                        ng-show=\"numberOfPlanOrganizations > 0 &&  model.enableOrgFilter\">\n" +
    "                                                        {{region.plan >= 0 ? region.plan : '-'}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\"\n" +
    "                                                        ng-show=\"model.enableOrgFilter\" style=\"min-width: 182px\">\n" +
    "                                                        {{region.real}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\"\n" +
    "                                                        ng-show=\"model.enableOrgFilter\" style=\"min-width: 180px\">\n" +
    "                                                        {{region.plan !== 0 ?\n" +
    "                                                        formatPercentage(region.planOrgPercentage) + '%' : '-'}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\" style=\"min-width: 160px\"\n" +
    "                                                        ng-show=\"getEnableApartmentHouseStatics() && !isEmptyPlanOfManagementHouse()\">\n" +
    "                                                        {{region.planManagementHouseTable.8 > 0 ?\n" +
    "                                                        region.planManagementHouseTable.8 :\n" +
    "                                                        '-'}}\n" +
    "                                                    </td>\n" +
    "\n" +
    "                                                    <td class=\"cell-center no-border _top\" style=\"min-width: 160px\"\n" +
    "                                                        ng-show=\"getEnableApartmentHouseStatics()\">\n" +
    "                                                        {{region.managementHouseTable.8}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\" style=\"min-width: 160px\"\n" +
    "                                                        ng-show=\"getEnableApartmentHouseStatics() && !isEmptyPlanOfManagementHouse()\">\n" +
    "                                                        {{region.planManagementHousePercent.8 !== 0 ?\n" +
    "                                                        formatPercentage(region.planManagementHousePercent.8) + '%'\n" +
    "                                                        : '-'}}\n" +
    "                                                    </td>\n" +
    "\n" +
    "                                                    <td class=\"cell-center no-border _top\" style=\"min-width: 160px\"\n" +
    "                                                        ng-show=\"model.managementHouseJD\">\n" +
    "                                                        {{region.planManagementHouseTable && region.planManagementHouseTable.7 > 0 ?\n" +
    "                                                        region.planManagementHouseTable.7 :\n" +
    "                                                        '-'}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\" style=\"min-width: 160px\"\n" +
    "                                                        ng-show=\"model.managementHouseJD\">\n" +
    "                                                        {{region.managementHouseTable && region.managementHouseTable.7 >= 0 ? region.managementHouseTable.7 : '-'}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\" style=\"min-width: 160px\"\n" +
    "                                                        ng-show=\"model.managementHouseJD\">\n" +
    "                                                        {{region.planManagementHousePercent && region.planManagementHousePercent.7 !== 0 ?\n" +
    "                                                        formatPercentage(region.planManagementHousePercent.7) + '%'\n" +
    "                                                        : '-'}}\n" +
    "                                                    </td>\n" +
    "                                                </tr>\n" +
    "                                                <tr> <!-------------------  ИТОГО --------------------------->\n" +
    "                                                    <td class=\"cell-center  no-border _left _top\"\n" +
    "                                                        style=\"min-width: 182px\"\n" +
    "                                                        ng-show=\"numberOfPlanOrganizations > 0 &&  model.enableOrgFilter\">\n" +
    "                                                        {{getSumData('plan')}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\"\n" +
    "                                                        ng-show=\"model.enableOrgFilter\" style=\"min-width: 182px\">\n" +
    "                                                        {{getSumData('real')}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\"\n" +
    "                                                        ng-show=\"model.enableOrgFilter\" style=\"min-width: 180px\">\n" +
    "                                                        {{getOrgTotalPercentage()}}\n" +
    "                                                    </td>\n" +
    "\n" +
    "                                                    <td class=\"cell-center no-border _top\" style=\"min-width: 160px\"\n" +
    "                                                        ng-show=\"getEnableApartmentHouseStatics() && !isEmptyPlanOfManagementHouse()\">\n" +
    "                                                        {{getSumData('planManagementHouseTable','8')}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\" style=\"min-width: 160px\"\n" +
    "                                                        ng-show=\"getEnableApartmentHouseStatics()\">\n" +
    "                                                        {{getSumData('managementHouseTable','8')}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\" style=\"min-width: 160px\"\n" +
    "                                                        ng-show=\"getEnableApartmentHouseStatics() && !isEmptyPlanOfManagementHouse()\">\n" +
    "                                                        {{getSumDataPercentage(getSumData('planManagementHouseTable','8'),getSumData('managementHouseTable','8'))}}\n" +
    "                                                    </td>\n" +
    "\n" +
    "                                                    <td class=\"cell-center no-border _top\" style=\"min-width: 160px\"\n" +
    "                                                        ng-show=\"model.managementHouseJD\">\n" +
    "                                                        {{getSumData('planManagementHouseTable','7')}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\" style=\"min-width: 160px\"\n" +
    "                                                        ng-show=\"model.managementHouseJD\">\n" +
    "                                                        {{getSumData('managementHouseTable','7')}}\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"cell-center no-border _top\" style=\"min-width: 160px\"\n" +
    "                                                        ng-show=\"model.managementHouseJD\">\n" +
    "                                                        {{getSumDataPercentage(getSumData('planManagementHouseTable','7'),getSumData('managementHouseTable','7'))}}\n" +
    "                                                    </td>\n" +
    "                                                </tr>\n" +
    "                                            </table>\n" +
    "\n" +
    "                                        </div>\n" +
    "                                    </td>\n" +
    "                                </tr>\n" +
    "\n" +
    "                                </tbody>\n" +
    "                            </table>\n" +
    "                            <div ng-if=\"model.enableOrgFilter&&numberOfPlanOrganizations > 0 ||\n" +
    "                                                        getEnableApartmentHouseStatics() && planOfManagementHouse > 0 ||\n" +
    "                                                        model.managementHouseJD && planOfJDHouse > 0\">\n" +
    "                                <br/>\n" +
    "                                <span class=\"intan-annotation\">* По данным, предоставленным органами государственной власти субъектов РФ в сфере ЖКХ</span>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "\n" +
    "\n" +
    "                    <!--<div class=\"row blockfix\"\n" +
    "                         ng-if=\"model.enableOrgFilter\">\n" +
    "\n" +
    "                        <hcs-pagination class=\"paginator\"\n" +
    "                                        pagination-config=\"pagination.paginationConfig\"\n" +
    "                                        modal=\"pagination.modal\"\n" +
    "                                        changed=\"pagination.pageChanged\"></hcs-pagination>\n" +
    "\n" +
    "                    </div>-->\n" +
    "                </div>\n" +
    "\n" +
    "            </div>\n" +
    "\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <!---   TIP -->\n" +
    "    <div id=\"tip\" ng-show=\"visibleMessage\" class=\"popover top\" ng-mousemove=\"mousemove($event)\">\n" +
    "\n" +
    "        <div class=\"form-horizontal\">\n" +
    "            <div class=\"modal-base\">\n" +
    "\n" +
    "                <div class=\"row\">\n" +
    "                    <div class=\"col-md-12 col-lg-12 col-sm-12\">\n" +
    "                        <div>\n" +
    "                            <a href=\"\" class=\"cnt-link text-center\"><h4 class=\"tip-popover-title roboto \">\n" +
    "                                {{currentRegionStatistic.name}}</h4></a>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"_padding-10 _left _right\">\n" +
    "                    <span class=\"lHr\"></span>\n" +
    "                </div>\n" +
    "                <div class=\"modal-body modal-base__body  _padding-10 _top  _left _right\">\n" +
    "\n" +
    "                    <div ng-if=\"model.enableOrgFilter\">\n" +
    "                        <h5 class=\"_margin-0 _bottom _top\">\n" +
    "                            <span ng-if=\"currentRegionStatistic.plan > 0\"><span class=\"percentage\">{{formatPercentage(currentRegionStatistic.planOrgPercentage)}}%</span>\n" +
    "                            В системе распределен<span ng-if=\"currentRegionStatistic.real===1\">о</span><span\n" +
    "                                        ng-if=\"currentRegionStatistic.real!==1\">ы</span> <b>{{getStaticByRegionInCloud(currentRegionStatistic,true,\n" +
    "                                    true)}}</b></span><span\n" +
    "                                ng-if=\"currentRegionStatistic.plan === 0\">Зарегистрирован<span ng-if=\"currentRegionStatistic.real===1\">а</span><span\n" +
    "                                ng-if=\"currentRegionStatistic.real!==1\">о</span> <b>{{getStaticByRegionInCloud(currentRegionStatistic,false,\n" +
    "                            false)}}</b></span>\n" +
    "                        </h5>\n" +
    "                    </div>\n" +
    "                    <div ng-if=\"currentRegionStatistic.orgCountByRole != null\" class=\"roboto\">\n" +
    "                        <div class=\"\" ng-if=\"model.enableOrgFilter\">\n" +
    "                            <div class=\"lHr _margin-10 _top _bottom\"></div>\n" +
    "                        </div>\n" +
    "\n" +
    "\n" +
    "                        <div class=\"organization-item\" ng-if=\"model.isSelectedFilter['1']\">\n" +
    "                            <!-- code 1 - Управляющая организация -->\n" +
    "                            <div class=\"organization-item\">\n" +
    "                                <b>{{currentRegionStatistic.orgCountByRole['1'].count}}</b>\n" +
    "                                <span class=\"desc-date\">({{currentRegionStatistic.orgCountByRole['1'].percentage}})</span> -\n" +
    "                                {{organizationMap[1]}}, в том числе:\n" +
    "                            </div>\n" +
    "                            <!-- code 1 - Управляющая организация -->\n" +
    "                            <div class=\"_padding-80 _left\" ng-if=\"model.isSelectedFilter['101']\"><b>{{currentRegionStatistic.orgCountByRole['101'].count}}</b>\n" +
    "                                <span class=\"desc-date\">({{currentRegionStatistic.orgCountByRole['101'].percentage}})</span> - Управляющая организация\n" +
    "                            </div>\n" +
    "                            <!-- code 1 - Управляющая организация -->\n" +
    "                            <div class=\"_padding-80 _left\" ng-if=\"model.isSelectedFilter['102']\"><b>{{currentRegionStatistic.orgCountByRole['102'].count}}</b>\n" +
    "                                <span class=\"desc-date\">({{currentRegionStatistic.orgCountByRole['102'].percentage}})</span> - ТСЖ\n" +
    "                            </div>\n" +
    "                            <!-- code 1 - Управляющая организация -->\n" +
    "                            <div class=\"_padding-80 _left\" ng-if=\"model.isSelectedFilter['103']\"><b>{{currentRegionStatistic.orgCountByRole['103'].count}}</b>\n" +
    "                                <span class=\"desc-date\">({{currentRegionStatistic.orgCountByRole['103'].percentage}})</span> - ЖК, ЖСК и\n" +
    "                                иной кооператив\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "\n" +
    "\n" +
    "                        <div class=\"organization-item\" ng-if=\"model.isSelectedFilter['2']\">\n" +
    "                            <!-- code 2 - Ресурсоснабжающая организация -->\n" +
    "\n" +
    "                            <b>{{currentRegionStatistic.orgCountByRole['2'].count}} </b>\n" +
    "                            <span class=\"desc-date\">({{currentRegionStatistic.orgCountByRole['2'].percentage}})</span>  -\n" +
    "                            {{organizationMap[2]}}\n" +
    "                        </div>\n" +
    "\n" +
    "\n" +
    "                        <div class=\"organization-item\">\n" +
    "                            <!-- code 9 - Орган государственной власти -->\n" +
    "                            <div ng-if=\"model.isSelectedFilter['9']\">\n" +
    "                                <b>{{currentRegionStatistic.orgCountByRole['9'].count}}</b>\n" +
    "                                <span class=\"desc-date\">({{currentRegionStatistic.orgCountByRole['9'].percentage}})</span> -\n" +
    "                                Орган государственной власти\n" +
    "                            </div>\n" +
    "                            <div ng-if=\"model.isSelectedFilter['8']\">\n" +
    "                                <!-- code 8 - Орган местного самоуправления в сфере ЖКХ -->\n" +
    "                                <div class=\"organization-item\">\n" +
    "                                    <b>{{currentRegionStatistic.orgCountByRole['80'].count}} </b>\n" +
    "                                    <span class=\"desc-date\">({{currentRegionStatistic.orgCountByRole['80'].percentage}})</span>\n" +
    "                                    -\n" +
    "                                    {{organizationMap[8]}}, в том числе:<br/>\n" +
    "                                </div>\n" +
    "                                <!-- code 5 - Муниципальный жилищный контроль -->\n" +
    "                                <div  class=\"_padding-80 _left\"><b>{{currentRegionStatistic.orgCountByRole['5']}}</b>\n" +
    "                                    - {{organizationMap[5]}}\n" +
    "                                </div>\n" +
    "\n" +
    "                                <!-- code 8 - Орган местного самоуправления в сфере ЖКХ -->\n" +
    "                                <div class=\"_padding-80 _left\"><b>{{currentRegionStatistic.orgCountByRole['8']}}</b>\n" +
    "                                    - Иные органы местного самоуправления\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                            <div ng-if=\"model.isSelectedFilter['7']\">\n" +
    "                                <!-- code 70 - в агрегированном виде: Орган гос. власти субъекта РФ в сфере ЖКХ -->\n" +
    "                                <div class=\"organization-item\">\n" +
    "                                    <b>{{currentRegionStatistic.orgCountByRole['70'].count}}</b>\n" +
    "                                    <span class=\"desc-date\">({{currentRegionStatistic.orgCountByRole['70'].percentage}})</span>\n" +
    "                                    -\n" +
    "                                    {{organizationMap[7]}}, в том числе:<br/>\n" +
    "                                </div>\n" +
    "                                <!-- code 4 - Государственный жилищный надзор -->\n" +
    "                                <div  class=\"_padding-80 _left\"><b>{{currentRegionStatistic.orgCountByRole['4']}}</b>\n" +
    "                                    - ОИВ субъекта РФ, уполномоченные на осуществление гос. жилищного надзора\n" +
    "                                </div>\n" +
    "                                <!-- code 10 - Орган исполнительной власти субъекта РФ в области государственного регулирования тарифов-->\n" +
    "                                <div  class=\"_padding-80 _left\"><b>{{currentRegionStatistic.orgCountByRole['10']}}</b>\n" +
    "                                    - ОИВ субъекта РФ в области гос. регулирования тарифов\n" +
    "                                </div>\n" +
    "                                <!-- code 12 - Орган государственной власти субъекта РФ в области энергосбережения и повышения энергетической эффективности-->\n" +
    "                                <div  class=\"_padding-80 _left\"><b>{{currentRegionStatistic.orgCountByRole['12']}}</b>\n" +
    "                                    - ОГВ субъекта РФ в области энергосбережения и повышения энергоэффективности\n" +
    "                                </div>\n" +
    "                                <!-- code 16 - Уполномоченный орган субъекта РФ-->\n" +
    "                                <div  class=\"_padding-80 _left\"><b>{{currentRegionStatistic.orgCountByRole['16']}}</b>\n" +
    "                                    - Уполномоченные органы субъекта РФ\n" +
    "                                </div>\n" +
    "                                <!-- code 7 - Орган гос. власти субъекта РФ в сфере ЖКХ -->\n" +
    "                                <div  class=\"_padding-80 _left\"><b>{{currentRegionStatistic.orgCountByRole['7']}}</b>\n" +
    "                                    - Иные органы государственной власти\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                            <!-- code 16 - Региональный оператор по обращению с твердыми коммунальными отходами -->\n" +
    "                            <div ng-if=\"model.isSelectedFilter['18']\">\n" +
    "                                <b>{{currentRegionStatistic.orgCountByRole['18'].count}}</b>\n" +
    "                                <span class=\"desc-date\">({{currentRegionStatistic.orgCountByRole['18'].percentage}})</span>  -\n" +
    "                                Региональный оператор по обращению с твердыми коммунальными отходами\n" +
    "                            </div>\n" +
    "                            <div ng-if=\"model.enableOrgFilter\">\n" +
    "                                <div ng-if=\"model.isSelectedFilter['14']\">\n" +
    "                                    <b>{{currentRegionStatistic.orgCountByRole['14'].count}}</b>\n" +
    "                                    <span class=\"desc-date\">({{currentRegionStatistic.orgCountByRole['14'].percentage}})</span> - Региональный оператор\n" +
    "                                    капитального ремонта\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "\n" +
    "                            <div class=\"lHr _margin-10 _top _bottom\" ng-if=\"model.enableOrgFilter && model.organizationFilter && model.organizationFilter.length>0\"></div>\n" +
    "\n" +
    "                            <div ng-if=\"model.enableOrgFilter\">\n" +
    "                                Указанные функции распределены между\n" +
    "                                <b>{{getStaticByRegionInCloud(currentRegionStatistic,true)}}</b>\n" +
    "                            </div>\n" +
    "\n" +
    "                            <div class=\"\" ng-if=\"isMoscow(currentRegionStatistic.id) && isSelectFilteredOrganization\">\n" +
    "                                <!--Москва-->\n" +
    "                                <hr/>\n" +
    "                                Зарегистрировано\n" +
    "                                {{federalRegion.realOrgCount|organizationFilter:false}}<br/>\n" +
    "                                свои функции на территории всей РФ -\n" +
    "                                {{formatPercentage(federalRegion.percentage)}} %\n" +
    "                                <br/>\n" +
    "                                <!-- code 3 - Оператор ГИС ЖКХ -->\n" +
    "                                <div ng-if=\"federalRegion.orgCountByRole['3']\">\n" +
    "                                    <b>{{federalRegion.orgCountByRole['3']}}</b> -\n" +
    "                                    {{organizationMap[3]}}\n" +
    "                                </div>\n" +
    "                                <!-- code 6 - Федеральный орган исполнительной власти в сфере ЖКХ -->\n" +
    "                                <div ng-if=\"federalRegion.orgCountByRole['6']\">\n" +
    "                                    <b>{{federalRegion.orgCountByRole['6']}}</b> -\n" +
    "                                    {{organizationMap[6]}}\n" +
    "                                </div>\n" +
    "                                <!-- code 14 - Специализированная некоммерческая организация (региональный оператор капитального ремонта)-->\n" +
    "                                <div ng-if=\"federalRegion.orgCountByRole['14']\">\n" +
    "                                    <b>{{federalRegion.orgCountByRole['14']}}</b> -\n" +
    "                                    {{organizationMap[14]}}\n" +
    "                                </div>\n" +
    "                                <!-- code 15 - Фонд содействия реформированию жилищно-коммунального хозяйства-->\n" +
    "                                <div ng-if=\"federalRegion.orgCountByRole['15']\">\n" +
    "                                    <b>{{federalRegion.orgCountByRole['15']}}</b> -\n" +
    "                                    {{organizationMap[15]}}\n" +
    "                                </div>\n" +
    "                                <!-- code 17 - Минстрой-->\n" +
    "                                <div ng-if=\"federalRegion.orgCountByRole['17']\">\n" +
    "                                    <b>{{federalRegion.orgCountByRole['17']}}</b> -\n" +
    "                                    {{organizationMap[17]}}\n" +
    "                                </div>\n" +
    "                                <div class=\"lHr _margin-10 _top _bottom\"></div>\n" +
    "                            </div>\n" +
    "\n" +
    "\n" +
    "                            <div ng-if=\"model.enableOrgFilter && (getEnableApartmentHouseStatics() || model.managementHouseJD)\">\n" +
    "                                <div class=\"lHr _margin-10 _top _bottom\"></div>\n" +
    "                            </div>\n" +
    "\n" +
    "\n" +
    "                            <div ng-if=\"getEnableApartmentHouseStatics() || model.managementHouseJD\" class=\"\">\n" +
    "                                <h5 class=\"_margin-0 _bottom _top\">\n" +
    "                                    <span class=\"percentage\">{{getPlanHousePercentStr(currentRegionStatistic)}} </span> Размещено <b>{{countHouse(currentRegionStatistic)}} домов</b>\n" +
    "                                </h5>\n" +
    "\n" +
    "                                <div class=\"lHr _margin-5 _top _bottom\"></div>\n" +
    "\n" +
    "                                <div ng-if=\"getEnableApartmentHouseStatics()\"><b>{{currentRegionStatistic.managementHouse[consts.HOUSE_MKD]}}</b> <span class=\"desc-date\">{{getPlanApartamentHousePercentStr(currentRegionStatistic)}}</span>\n" +
    "                                    - многоквартирные дома в разрезе способов управления:\n" +
    "                                </div>\n" +
    "                                <div class=\"_padding-80 _left\" ng-if=\"model.enableManagementHouseTypeFilter&&model.managementHouseByDirectControl\">\n" +
    "                                    <b>{{currentRegionStatistic.managementHouse[consts.HOUSE_BY_DIRECT_CONTROL]}}</b>\n" +
    "                                    - непосредственное управление\n" +
    "                                </div>\n" +
    "                                <div class=\"_padding-80 _left\" ng-if=\"model.enableManagementHouseTypeFilter&&model.managementHouseByManagementOrganization\">\n" +
    "                                    <b>{{currentRegionStatistic.managementHouse[consts.HOUSE_BY_MANAGEMENT_ORGANIZATION]}}</b>\n" +
    "                                    - управляющая организация\n" +
    "                                </div>\n" +
    "                                <div class=\"_padding-80 _left\" ng-if=\"model.enableManagementHouseTypeFilter&&model.managementHouseByManagementCooperative\">\n" +
    "                                    <b>{{currentRegionStatistic.managementHouse[consts.HOUSE_BY_COOPERATIVE]}}</b>\n" +
    "                                    - ТСЖ, ЖСК, ЖК, иной кооператив\n" +
    "                                </div>\n" +
    "                                <div class=\"_padding-80 _left\" ng-if=\"model.enableManagementHouseTypeFilter&&model.managementHouseByAnotherWay\">\n" +
    "                                    <b>{{currentRegionStatistic.managementHouse[consts.HOUSE_BY_ANOTHER_WAY]}}</b>\n" +
    "                                    - способ управления не выбран или не реализован\n" +
    "                                </div>\n" +
    "                                <div class=\"_padding-80 _left\" ng-if=\"model.enableManagementHouseTypeFilter&&model.managementHouseByUnknown\">\n" +
    "                                    <b>{{currentRegionStatistic.managementHouse[consts.HOUSE_BY_UNKNOWN]}}</b>\n" +
    "                                    - информация о способе управления не размещена в системе\n" +
    "                                </div>\n" +
    "                                <br/>\n" +
    "                            </div>\n" +
    "\n" +
    "                            <div ng-if=\"model.managementHouseJD\"><b>{{currentRegionStatistic.managementHouse[consts.HOUSE_JD]}}</b> <span class=\"desc-date\">{{getPlanDwellingHousePercentStr(currentRegionStatistic)}}</span>\n" +
    "                                - жилые дома, включая блокированную застройку\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "\n" +
    "\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "\n" +
    "        <!--<br/>\n" +
    "        Зарегистрировано {{currentRegionStatistic.houseCount || 0 }} домов\n" +
    "        &lt;!&ndash;TODO ­ 	Процент зарегистрированных домов см ЭФ_ПОЧ_КартаРег.33 &ndash;&gt;\n" +
    "        <div ng-if=\"currentRegionStatistic && currentRegionStatistic.houseCount && currentRegionStatistic.houseCount > 0\">\n" +
    "            <br/>\n" +
    "            Среди них:<br/>\n" +
    "\n" +
    "            <div ng-repeat=\"(key, value) in currentRegionStatistic.housesByManagementType\">{{value}} -\n" +
    "                {{regionHouseStatistics.managementTypeMap[key].name}}\n" +
    "            </div>\n" +
    "        </div>-->\n" +
    "\n" +
    "        <span class=\"arrow tipCorner\"></span>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("main-forms/map/statOfWaterQualityMap.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("main-forms/map/statOfWaterQualityMap.tpl.html",
    "<form-header page-title=\"pageTitle\" breadcrumbs=\"breadcrumbs\"></form-header>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-3 margin-right-m-100\">\n" +
    "        <div class=\"_margin-50 _top\">\n" +
    "            <h4>Доля источников и <br/> водопроводов, <br/> не отвечающих <br/> санитарным нормам <br/> и правилам</h4>\n" +
    "        </div>\n" +
    "        <ul class=\"public-statistic-legend\">\n" +
    "            <li>\n" +
    "                <span class=\"legend-ico wlico5\"></span>\n" +
    "                <span class=\"legend-txt\">40 - 100%</span>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <span class=\"legend-ico wlico4\"></span>\n" +
    "                <span class=\"legend-txt\">21 - 40%</span>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <span class=\"legend-ico wlico3\"></span>\n" +
    "                <span class=\"legend-txt\">10 - 21%</span>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <span class=\"legend-ico wlico2\"></span>\n" +
    "                <span class=\"legend-txt\">0 - 10%</span>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <span class=\"legend-ico wlico1\"></span>\n" +
    "                <span class=\"legend-txt0\">Нет данных</span>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-10 pull-right\">\n" +
    "        <intan-map\n" +
    "            regions=\"mapData\"\n" +
    "            on-mouse-over=\"specifyRegion\"\n" +
    "            tooltip-id=\"water-quality-map-tooltip\">\n" +
    "        </intan-map>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div id=\"water-quality-map-tooltip\" class=\"popover top intan-tooltip intan-map-tooltip\">\n" +
    "    <div class=\"header\">\n" +
    "        {{currentRegionStatistic.name}}\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"separator\"></div>\n" +
    "\n" +
    "    <div ng-if=\"currentRegionStatistic.waterQualityStatistic\">\n" +
    "        <div class=\"row top\">\n" +
    "            <div class=\"col-xs-2\">\n" +
    "                <div class=\"value\" ng-style=\"{'background-color': currentRegionStatistic.fill}\">\n" +
    "                    {{currentRegionStatistic.waterQualityStatistic.wrongPercentage}}%</div>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-10\">\n" +
    "                <div class=\"description\">\n" +
    "                    Доля источников и водопроводов, не отвечающих санитарным нормам и правилам\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"separator\"></div>\n" +
    "\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-xs-2 text-right\">\n" +
    "                <span class=\"value\">{{currentRegionStatistic.waterQualityStatistic.objectsTotal}}</span>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-10\">\n" +
    "                Всего источников и водопроводов\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-xs-2 text-right\">\n" +
    "                <span class=\"value\">{{currentRegionStatistic.waterQualityStatistic.wrongSourcesTotal}}</span>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-10\">\n" +
    "                Источников и водопроводов, не отвечающих санитарным нормам и правилам\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"text-center\" ng-if=\"!currentRegionStatistic.waterQualityStatistic\">\n" +
    "        Нет данных\n" +
    "    </div>\n" +
    "\n" +
    "    <span class=\"arrow\"></span>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"water-quality-statistics\">\n" +
    "    <div class=\"\" id=\"main\">\n" +
    "        <div class=\"app-content content-mg-b ng-scope\">\n" +
    "\n" +
    "                <div class=\"hcs-public-stat-of-water-map-data-block row col-xs-12\">\n" +
    "\n" +
    "                            <table class=\"table-entity\" id=\"mainTable\" ng-show=\"dataLoaded\">\n" +
    "                                <thead>\n" +
    "                                <tr>\n" +
    "                                    <th class=\"cell-center \" rowspan=\"2\">\n" +
    "                                        <div style=\"width: 14px\"><b>№</b></div>\n" +
    "                                    </th>\n" +
    "                                    <th class=\"cell-center \" rowspan=\"2\">\n" +
    "                                        <div style=\"width: 32px\"></div>\n" +
    "                                    </th>\n" +
    "                                    <th class=\"\" rowspan=\"2\" data-sort=\"{{sortedDirect}}\" ng-class=\"{onsorted: sortedField == 'name'}\"  ng-click=\"sort('name')\">\n" +
    "                                        <div style=\"width: 96px\"><b>Территория</b></div>\n" +
    "                                    </th>\n" +
    "                                    <th class=\"rotate _padding-67\" rowspan=\"2\" data-sort=\"{{sortedDirect}}\" ng-class=\"{onsorted: sortedField == 'objectsTotal'}\"  ng-click=\"sort('objectsTotal')\">\n" +
    "                                        <div style=\"width: 34px\"><b>Число <br/> объектов</b></div>\n" +
    "                                    </th>\n" +
    "\n" +
    "                                </tr>\n" +
    "\n" +
    "                                <tr>\n" +
    "                                    <th class=\"_padding-0 _top  _bottom _right _left\" colspan=\"18\">\n" +
    "                                        <div id=\"headDiv\" style=\"max-width: 907px; width: auto; overflow: auto;\">\n" +
    "                                            <table id=\"headTable\" class=\"table-entity head-table\">\n" +
    "                                                <thead>\n" +
    "                                                <tr>\n" +
    "                                                    <th class=\" \" colspan=\"4\">\n" +
    "                                                        <b>Источников и водопроводов, не отвечающих санитарным нормам и правилам</b>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\" \" colspan=\"4\">\n" +
    "                                                        <b>Исследовано проб по санитарно-химическим показателям</b>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\" \" colspan=\"3\">\n" +
    "                                                        <b>Исследовано проб по микробиологическим показателям</b>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\" \" colspan=\"2\">\n" +
    "                                                        <b>Исследовано проб по паразитологическим показателям</b>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\" \" colspan=\"3\">\n" +
    "                                                        <b>Исследовано проб на суммарную альфа-, бета-активность</b>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"\" colspan=\"2\">\n" +
    "                                                        <b>Исследовано проб на природные радионуклиды</b>\n" +
    "                                                    </th>\n" +
    "                                                </tr>\n" +
    "                                                <tr >\n" +
    "                                                    <th class=\"rotate\"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'wrongSourcesTotal'}\"\n" +
    "                                                        ng-click=\"sort('wrongSourcesTotal')\">\n" +
    "                                                        <div><b>Всего</b></div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'lackOfSanitaryProtectionNmbr'}\"\n" +
    "                                                        ng-click=\"sort('lackOfSanitaryProtectionNmbr')\">\n" +
    "                                                        <div>В т.ч. из-за <br/> отсутствия зоны </br> санитарной охраны</div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'lockOfPurificationWorksNmbr'}\"\n" +
    "                                                        ng-click=\"sort('lockOfPurificationWorksNmbr')\">\n" +
    "                                                        <div>В т.ч. из-за отсутствия <br/> необход. комплекса</br> очистных сооружений</div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'lockOfDecontaminationPlantNmbr'}\"\n" +
    "                                                        ng-click=\"sort('lockOfDecontaminationPlantNmbr')\">\n" +
    "                                                        <div>В т.ч.из-за отсутствия <br/> обеззараживающих</br> установок</div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'testOfSanitaryChemicalIndexTotal'}\"\n" +
    "                                                        ng-click=\"sort('testOfSanitaryChemicalIndexTotal')\">\n" +
    "                                                        <div><b>Всего</b></div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'tosciWrongSanitEpidemiolRequirNmbr'}\"\n" +
    "                                                        ng-click=\"sort('tosciWrongSanitEpidemiolRequirNmbr')\">\n" +
    "                                                        <div>Из них не соответствует <br/> санитарно-</br>эпидемиологическим требованиям</div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'researchContentFluorineNmbr'}\"\n" +
    "                                                        ng-click=\"sort('researchContentFluorineNmbr')\">\n" +
    "                                                        <div>В т.ч. исследовано на <br/> содержание фтора</div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'rcfWrongSanitEpidemiolRequirNmbr'}\"\n" +
    "                                                        ng-click=\"sort('rcfWrongSanitEpidemiolRequirNmbr')\">\n" +
    "                                                        <div>Из них не соответствует <br/> санитарно-эпидемиологическим <br/> требованиям</div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'microbiologicalIndexTotal'}\"\n" +
    "                                                        ng-click=\"sort('microbiologicalIndexTotal')\">\n" +
    "                                                        <div><b>Всего</b></div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'miWrongSanitEpidemiolRequirNmbr'}\"\n" +
    "                                                        ng-click=\"sort('miWrongSanitEpidemiolRequirNmbr')\">\n" +
    "                                                        <div>Из них не соответствует <br/> санитарно-эпидемиологическим </br> требованиям</div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'wrongMicroorganismNmbr'}\"\n" +
    "                                                        ng-click=\"sort('wrongMicroorganismNmbr')\">\n" +
    "                                                        <div>В т.ч.  числе выделены </br> патогенные</br> микроорганизмы</div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'parasiteIndexTotal'}\"\n" +
    "                                                        ng-click=\"sort('parasiteIndexTotal')\">\n" +
    "                                                        <div><b>Всего</b></div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'piWrongSanitEpidemiolRequirNmbr'}\"\n" +
    "                                                        ng-click=\"sort('piWrongSanitEpidemiolRequirNmbr')\">\n" +
    "                                                        <div>Из них не соответствует </br> санитарно-эпидемиологическим </br> требованиям</div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'aBActivityTotal'}\"\n" +
    "                                                        ng-click=\"sort('aBActivityTotal')\">\n" +
    "                                                        <div><b>Всего</b></div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'excessOfAActivityNmbr'}\"\n" +
    "                                                        ng-click=\"sort('excessOfAActivityNmbr')\">\n" +
    "                                                        <div>Из них с превышением </br> контрольных уровней</br> по суммарной альфа-активности</div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'excessOfBActivityNmbr'}\"\n" +
    "                                                        ng-click=\"sort('excessOfBActivityNmbr')\">\n" +
    "                                                        <div>Из них с превышением </br> контрольного уровня</br> по суммарной бета-активности</div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate  \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'radionuclideTotal'}\"\n" +
    "                                                        ng-click=\"sort('radionuclideTotal')\">\n" +
    "                                                        <div><b>Всего</b></div>\n" +
    "                                                    </th>\n" +
    "                                                    <th class=\"rotate \"\n" +
    "                                                        data-sort=\"{{sortedDirect}}\"\n" +
    "                                                        ng-class=\"{onsorted: sortedField == 'excessOfInterventionNmbr', 'pc-table-entity-border-top': true}\"\n" +
    "                                                        ng-click=\"sort('excessOfInterventionNmbr')\">\n" +
    "                                                        <div>Из них с превышением </br> уровня вмешательства</div>\n" +
    "                                                    </th>\n" +
    "                                                </tr>\n" +
    "                                                </thead>\n" +
    "                                            </table>\n" +
    "                                        </div>\n" +
    "                                    </th>\n" +
    "                                </tr>\n" +
    "                                </thead>\n" +
    "                                <tbody class=\"main-body-water-map\">\n" +
    "                                    <tr>\n" +
    "                                        <td colspan=\"4\" rowspan=\"{{tableData.length + 1}}\" class=\"_padding-0 _right _left _top _bottom\">\n" +
    "                                            <div class=\"\" id=\"body-div-1\" style=\"width: auto; overflow: hidden; height: 700px;\">\n" +
    "                                                <table class=\"body-table-water-map\">\n" +
    "                                                    <tr>\n" +
    "                                                        <td class=\"cell-center _vertical-align_middle no-border _top _left\"><span></span></td>\n" +
    "                                                        <td class=\"cell-center _vertical-align_middle table-entity_cell_dark no-border _top\"><span></span></td>\n" +
    "                                                        <td class=\"_vertical-align_middle table-entity_cell_dark no-border _top\"><span>{{russiaStatistics.name}}</span></td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle no-border _top _right\" ><span>{{russiaStatistics.waterQualityStatistic.objectsTotal}}</span></td>\n" +
    "                                                    </tr>\n" +
    "                                                    <tr ng-repeat=\"region in tableData\">\n" +
    "                                                        <td class=\"cell-center _vertical-align_middle no-border _left\"><div  style=\"width: 14px;\">{{$index + 1}}</div></td>\n" +
    "                                                        <td class=\"_vertical-align_middle\">\n" +
    "                                                            <span  style=\"width: 32px;\" class=\"{{getColorClassOfRegionPercentage(region)}}\"></span>\n" +
    "                                                        </td>\n" +
    "                                                        <td class=\"_vertical-align_middle table-entity_cell_dark\"><div  style=\"width: 96px;\">{{region.name}}</div></td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle no-border _right\"><div  style=\"width: 34px;\">{{region.waterQualityStatistic.objectsTotal}}</div></td>\n" +
    "                                                    </tr>\n" +
    "                                                </table>\n" +
    "                                            </div>\n" +
    "                                        </td>\n" +
    "                                        <td colspan=\"19\" rowspan=\"{{tableData.length + 1}}\" class=\"_padding-0 _right _left _top _bottom\">\n" +
    "                                            <div class=\"body-div\" style=\"max-width: 907px; width: auto; overflow-x: hidden; height: 700px\">\n" +
    "                                                <table class=\"body-table-water-map\">\n" +
    "                                                    <tr>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle table-entity_cell_dark\"><b><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.wrongSourcesTotal}}</b></td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\"><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.lackOfSanitaryProtectionNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\"><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.lockOfPurificationWorksNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\"><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.lockOfDecontaminationPlantNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle table-entity_cell_dark\"><b><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.testOfSanitaryChemicalIndexTotal}}</b></td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\"><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.tosciWrongSanitEpidemiolRequirNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\"><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.researchContentFluorineNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\"><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.rcfWrongSanitEpidemiolRequirNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle table-entity_cell_dark\"><b><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.microbiologicalIndexTotal}}</b></td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\"><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.miWrongSanitEpidemiolRequirNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\"><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.wrongMicroorganismNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle table-entity_cell_dark\"><b><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.parasiteIndexTotal}}</b></td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\"><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.piWrongSanitEpidemiolRequirNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle table-entity_cell_dark\"><b><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.aBActivityTotal}}</b></td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\"><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.excessOfAActivityNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\"><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.excessOfBActivityNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle table-entity_cell_dark\"><b><span class=\"fix__width\"></span>{{russiaStatistics.waterQualityStatistic.radionuclideTotal}}</b></td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\"><span class=\"fix__width _padding-10 _right\">{{russiaStatistics.waterQualityStatistic.excessOfInterventionNmbr}}</span></td>\n" +
    "                                                            <td class=\"\" style=\"visibility: hidden\"><span class=\"fix__width\"></span>{{russiaStatistics.name}}</td>\n" +
    "                                                    </tr>\n" +
    "                                                    <tr ng-repeat=\"region in tableData\"  init-width>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle table-entity_cell_dark\"><b>{{region.waterQualityStatistic.wrongSourcesTotal}}</b></div></td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\">{{region.waterQualityStatistic.lackOfSanitaryProtectionNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\">{{region.waterQualityStatistic.lockOfPurificationWorksNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\">{{region.waterQualityStatistic.lockOfDecontaminationPlantNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle table-entity_cell_dark\"><div><b>{{region.waterQualityStatistic.testOfSanitaryChemicalIndexTotal}}</b></div></td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\">{{region.waterQualityStatistic.tosciWrongSanitEpidemiolRequirNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\">{{region.waterQualityStatistic.researchContentFluorineNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\">{{region.waterQualityStatistic.rcfWrongSanitEpidemiolRequirNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle table-entity_cell_dark\"><b>{{region.waterQualityStatistic.microbiologicalIndexTotal}}</b></td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\">{{region.waterQualityStatistic.miWrongSanitEpidemiolRequirNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\">{{region.waterQualityStatistic.wrongMicroorganismNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle table-entity_cell_dark\"><b>{{region.waterQualityStatistic.parasiteIndexTotal}}</b></td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\">{{region.waterQualityStatistic.piWrongSanitEpidemiolRequirNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle table-entity_cell_dark\"><div><b>{{region.waterQualityStatistic.aBActivityTotal}}</b></div></td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\">{{region.waterQualityStatistic.excessOfAActivityNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\">{{region.waterQualityStatistic.excessOfBActivityNmbr}}</td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle table-entity_cell_dark\"><div><b>{{region.waterQualityStatistic.radionuclideTotal}}</b></div></td>\n" +
    "                                                        <td class=\"text-right _vertical-align_middle\"><div class=\"_padding-10 _right\">{{region.waterQualityStatistic.excessOfInterventionNmbr}}</div></td>\n" +
    "                                                        <td class=\"height__fix\" style=\"visibility: hidden\"><div style=\"width: 96px;\">{{region.name}}</div></td>\n" +
    "                                                    </tr>\n" +
    "                                                </table>\n" +
    "                                            </div>\n" +
    "                                        </td>\n" +
    "                                    </tr>\n" +
    "\n" +
    "                                </tbody>\n" +
    "                            </table>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "");
}]);

angular.module("public-mkd-odpu-2/public-mkd-odpu-2.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("public-mkd-odpu-2/public-mkd-odpu-2.tpl.html",
    "<intan-widget-header page-title=\"vm.pageTitle\" breadcrumbs=\"vm.breadcrumbs\"\n" +
    "                     info-date=\"vm.date\"></intan-widget-header>\n" +
    "\n" +
    "<div class=\"form-base _margin-20 _top\">\n" +
    "    <div class=\"form-base__body\">\n" +
    "\n" +
    "        <div class=\"row form-base__row\">\n" +
    "            <div class=\"form-group form-base__form-group\">\n" +
    "                <label class=\"col-xs-2 control-label form-base__control-label\">\n" +
    "                    Год ввода в эксплуатацию</label>\n" +
    "\n" +
    "                <div class=\"col-xs-10 form-group form-base__form-group\">\n" +
    "                    <!--TODO: изменить rz-slider-tpl-url после переноса в pafo-{}-web-package-->\n" +
    "                    <intan-rzslider\n" +
    "                            ng-model=\"vm.yearRange\" on-stop-slide=\"vm.onStopSlide()\">\n" +
    "                    </intan-rzslider>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"form-group form-base__form-group\">\n" +
    "                <label class=\"col-xs-2 control-label form-base__control-label\">\n" +
    "                    Коммунальный ресурс</label>\n" +
    "\n" +
    "                <div class=\"col-xs-4 form-group form-base__form-group\">\n" +
    "                    <select ui-select2 class=\"form-control form-base__control-label_low\"\n" +
    "                            ng-model=\"vm.resource\"\n" +
    "                            ng-change=\"vm.resourceChange()\">\n" +
    "\n" +
    "                        <option ng-repeat=\"resource in vm.resources\"\n" +
    "                                value=\"{{resource.code}}\">{{resource.name}}\n" +
    "                        </option>\n" +
    "                    </select>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-3 margin-right-m-100\">\n" +
    "        <h4 class=\"_padding-20 _top\">Процент домов, оснащенных общедомовыми приборами учета</h4>\n" +
    "\n" +
    "        <ul class=\"public-statistic-legend\">\n" +
    "            <li ng-repeat=\"range in vm.ranges\">\n" +
    "                <span class=\"legend-ico\" ng-class=\"range.style\"></span>\n" +
    "                <span class=\"legend-txt\">{{range.name}}</span>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <span class=\"legend-ico wlico1\"></span>\n" +
    "                <span class=\"legend-txt0\">данные отсутствуют</span>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-10 pull-right\">\n" +
    "        <intan-map\n" +
    "                regions=\"vm.mapData\"\n" +
    "                on-mouse-over=\"vm.specifyRegion\"\n" +
    "                on-click=\"vm.selectRegion\"\n" +
    "                tooltip-id=\"public-statistic-region-map-tip\">\n" +
    "        </intan-map>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"form-base _margin-20 _top\">\n" +
    "    <div class=\"form-base__body\">\n" +
    "        <div class=\"form-group form-base__form-group _margin-0 _bottom\">\n" +
    "            <div class=\"col-xs-3\">\n" +
    "                <label>Отображать на диаграмме информацию по территории:</label>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                <div class=\"catalog-choice\">\n" +
    "                    <div class=\"form-base__container-form-control\">\n" +
    "                        <input type=\"text\" class=\"form-control form-base__form-control clearable\"\n" +
    "                               ng-model=\"vm.selectedTerritoryName\"\n" +
    "                               placeholder=\"Все регионы\"\n" +
    "                               readonly=\"true\"\n" +
    "                               clearable ng-change=\"vm.clearTerritory()\"/>\n" +
    "                    </div>\n" +
    "                    <div class=\"catalog-choice__button\" ng-click=\"vm.selectTerritory()\">\n" +
    "                        <span class=\"catalog-choice__icon hif icon-burger-menu\"></span>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\" ng-if=\"vm.barChartData\">\n" +
    "    <div class=\"col-xs-9 public-statistic-public-mkd-odpu-2-bar-chart\">\n" +
    "        <intan-group-bar-chart data=\"vm.barChartData\" options=\"vm.barChartOptions\"\n" +
    "                               mouse-over=\"vm.showChartTip\" mouse-out=\"vm.hideChartTip\">\n" +
    "        </intan-group-bar-chart>\n" +
    "    </div>\n" +
    "    <div class=\"col-xs-3\">\n" +
    "        <div class=\"public-statistic-public-mkd-odpu-2-bar-chart-tip\" ng-show=\"vm.chartTipData\">\n" +
    "            Оснащено приборами учета {{vm.chartTipData.tipLabel}}<br/><br/>\n" +
    "            <div ng-repeat=\"barData in vm.chartTipData.data\">\n" +
    "                <b>{{barData.tipLabel}}</b>\n" +
    "                <div class=\"tip-value\" ng-if=\"barData.value != null\">{{barData.value}}% {{barData.tipValue | number}} МКД</div>\n" +
    "                <div class=\"tip-value\" ng-if=\"barData.value == null\">{{barData.tipValue}}</div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div id=\"public-statistic-region-map-tip\"\n" +
    "     class=\"public-statistic-region-map-tip popover top form-base form-base__body _padding-0 _top roboto\">\n" +
    "\n" +
    "    <a href=\"\" class=\"cnt-link text-center\">\n" +
    "        <h4 class=\"tip-popover-title roboto\">{{vm.specifiedRegion.name}}</h4>\n" +
    "    </a>\n" +
    "\n" +
    "    <div class=\"lHr _padding-10 _left _right _bottom\"></div>\n" +
    "\n" +
    "    <div ng-if=\"vm.specifiedRegion.totalMkd\">\n" +
    "        <h5 class=\"_margin-0 _bottom\">\n" +
    "            <span class=\"public-statistic-value\">{{vm.specifiedRegion.mainValue}}%</span>\n" +
    "            Общий процент многоквартирных домов, оснащённых общедомовыми приборами учета\n" +
    "        </h5>\n" +
    "\n" +
    "\n" +
    "        <div class=\"lHr _margin-10 _top _bottom\"></div>\n" +
    "\n" +
    "        <div ng-if=\"vm.managementTypesAvailable(vm.specifiedRegion)\">\n" +
    "        В т.ч. по способам управления:\n" +
    "\n" +
    "        <div class=\"_padding-30 _left\">\n" +
    "            <div ng-if=\"vm.specifiedRegion.directControlMkdPercent\">\n" +
    "                <span class=\"public-statistic-value\">{{vm.specifiedRegion.directControlMkdPercent | intanPercent}}</span>\n" +
    "                - Непосредственное управление\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-if=\"vm.specifiedRegion.managementOrganizationMkdPercent\">\n" +
    "                <span class=\"public-statistic-value\">{{vm.specifiedRegion.managementOrganizationMkdPercent | intanPercent}}</span>\n" +
    "                - Управляющая организация\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-if=\"vm.specifiedRegion.tsjMkdPercent\">\n" +
    "                <span class=\"public-statistic-value\">{{vm.specifiedRegion.tsjMkdPercent | intanPercent}}</span>\n" +
    "                - ТСЖ\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-if=\"vm.specifiedRegion.zkMkdPercent\">\n" +
    "                <span class=\"public-statistic-value\">{{vm.specifiedRegion.zkMkdPercent | intanPercent}}</span>\n" +
    "                - ЖК\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-if=\"vm.specifiedRegion.cooperativeMkdPercent\">\n" +
    "                <span class=\"public-statistic-value\">{{vm.specifiedRegion.cooperativeMkdPercent | intanPercent}}</span>\n" +
    "                - Иной кооператив\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-if=\"vm.specifiedRegion.noControlMkdPercent\">\n" +
    "                <span class=\"public-statistic-value\">{{vm.specifiedRegion.noControlMkdPercent | intanPercent}}</span>\n" +
    "                - Способ управления не выбран или не реализован\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-if=\"vm.specifiedRegion.unpublishedMkdPercent\">\n" +
    "                <span class=\"public-statistic-value\">{{vm.specifiedRegion.unpublishedMkdPercent | intanPercent}}</span>\n" +
    "                - Информация о способе управления не размещена в системе\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"lHr _margin-10 _top _bottom\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"_margin-10 _bottom\">\n" +
    "            <span class=\"public-statistic-value\">{{vm.specifiedRegion.totalMkd | number}}</span>\n" +
    "            МКД {{vm.numeralCoherentText(vm.specifiedRegion.totalMkd, ' размещен', ' размещено', ' размещено')}}\n" +
    "            в Системе, в которые поставляется ресурс {{vm.resourceName()}}, при этом год ввода в эксплуатацию {{vm.yearsRangeForTooltip()}}\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <h4 ng-if=\"!vm.specifiedRegion.totalMkd\" class=\"text-center\">Нет данных</h4>\n" +
    "\n" +
    "    <span class=\"arrow tipCorner\"></span>\n" +
    "</div>\n" +
    "");
}]);

angular.module("public-mkd-odpu/public-mkd-odpu.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("public-mkd-odpu/public-mkd-odpu.tpl.html",
    "<intan-widget-header page-title=\"vm.pageTitle\" breadcrumbs=\"vm.breadcrumbs\"\n" +
    "    info-date=\"vm.date\"></intan-widget-header>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-3 margin-right-m-100\">\n" +
    "        <h4 class=\"_margin-50 _top\" ng-if=\"vm.legend\">{{vm.legend.statisticName}}\n" +
    "\n" +
    "            <intan-info-tooltip tooltip-id=\"intan-public-mkd-odpu-popover-tooltip\"></intan-info-tooltip>\n" +
    "            <script type=\"text/ng-template\" id=\"intan-public-mkd-odpu-popover-tooltip\">\n" +
    "                <div class=\"hcs-popover-tooltip intan-service-providers-data-info-tooltip\">\n" +
    "                    Процент рассчитывается исходя из общего количества многоквартирных домов,\n" +
    "                    в которые в целях предоставления коммунальных услуг поставляется выбранный коммунальный ресурс,\n" +
    "                    что определяется по наличию договора ресурсоснабжения на заданный коммунальный ресурс, либо договора управления/устава.\n" +
    "                </div>\n" +
    "                <div class=\"triangle\"></div>\n" +
    "            </script>\n" +
    "        </h4>\n" +
    "\n" +
    "        <div class=\"intan-range\" ng-if=\"vm.legend\" ng-repeat=\"interval in vm.legend.intervals\">\n" +
    "            <div class=\"color intan-disk-30\" ng-style=\"{'background-color': interval.color}\"></div>\n" +
    "            <div class=\"text\">{{interval.startValue | intanPercent:0:'':'0'}} -\n" +
    "                {{interval.endValue | intanPercent:0:'':'100'}}{{vm.legend.measureUnit}}</div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"intan-range\">\n" +
    "            <div class=\"color intan-disk-30 intan-bg-gray\"></div>\n" +
    "            <div class=\"text\">данные отсутствуют</div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-10 pull-right\">\n" +
    "        <intan-map\n" +
    "            regions=\"vm.regions\"\n" +
    "            on-mouse-over=\"vm.specifyRegion\"\n" +
    "            tooltip-id=\"public-statistic-region-map-tip\">\n" +
    "        </intan-map>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"form-base _margin-20 _top\">\n" +
    "    <div class=\"form-base__body\">\n" +
    "        <div class=\"row form-base__row\">\n" +
    "            <div class=\"col-xs-1\">\n" +
    "                <label>Отображать на карте:</label>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"col-xs-4\">\n" +
    "                <label class=\"control-label form-base__control-label _margin-20 _left\">\n" +
    "                    Год ввода в эксплуатацию</label>\n" +
    "\n" +
    "                <div class=\"form-group form-base__form-group _margin-20 _left\">\n" +
    "                    <intan-year-interval ng-model=\"vm.yearInterval\" ng-change=\"vm.getData()\"></intan-year-interval>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"col-xs-4\">\n" +
    "                <label class=\"control-label form-base__control-label\">\n" +
    "                    Способы управления</label>\n" +
    "\n" +
    "                <div class=\"form-group form-base__form-group\">\n" +
    "                    <multiselecttree\n" +
    "                        multiple=\"true\"\n" +
    "                        ng-model=\"vm.selectedHouseManagementTypes\"\n" +
    "                        all-select-ability=\"true\"\n" +
    "                        options=\"type.name for type in vm.houseManagementTypes\"\n" +
    "                        change=\"vm.getData()\"\n" +
    "                        header=\"vm.getHouseManagementTypeHeader()\"\n" +
    "                        formapregistaraion=\"true\">\n" +
    "                    </multiselecttree>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"col-xs-3\">\n" +
    "                <label class=\"control-label form-base__control-label _margin-20 _left\">\n" +
    "                    Коммунальный ресурс</label>\n" +
    "\n" +
    "                <div class=\"form-group form-base__form-group  _margin-20 _left\">\n" +
    "                    <select ui-select2\n" +
    "                            class=\"form-control form-base__form-control\"\n" +
    "                            ng-model=\"vm.selectedResourceCode\"\n" +
    "                            data-placeholder=\"Выберите значение\"\n" +
    "                            ng-change=\"vm.getData()\">\n" +
    "\n" +
    "                        <option value=\"\"></option>\n" +
    "                        <option ng-repeat=\"munResource in vm.munResourceCodes\"\n" +
    "                                value=\"{{munResource}}\">\n" +
    "                            {{vm.munResourceNames[munResource]}}\n" +
    "                        </option>\n" +
    "                    </select>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div id=\"public-statistic-region-map-tip\"\n" +
    "     class=\"public-statistic-region-map-tip popover top form-base form-base__body _padding-0 _top roboto\">\n" +
    "\n" +
    "    <a href=\"\" class=\"cnt-link text-center\">\n" +
    "        <h4 class=\"tip-popover-title roboto\">{{vm.specifiedRegion.name}}</h4>\n" +
    "    </a>\n" +
    "\n" +
    "    <div class=\"lHr _padding-5 _top _bottom\"></div>\n" +
    "\n" +
    "    <div ng-show=\"vm.specifiedRegion.value && vm.specifiedRegion.mkdCount\">\n" +
    "\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-xs-12\">\n" +
    "                <span class=\"public-statistic-value\">{{vm.specifiedRegion.mkdWithPuPercent | intanPercent:2}}</span>\n" +
    "                Общий процент многоквартирных домов, оснащенных общедомовыми приборами учета\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    <div class=\"lHr _margin-10 _top _bottom\"></div>\n" +
    "\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-xs-12\">\n" +
    "                В т.ч. по способам управления:\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\" ng-repeat=\"houseManagementType in vm.houseManagementTypeList\">\n" +
    "            <div class=\"col-xs-12\">\n" +
    "                <span class=\"public-statistic-value\">\n" +
    "                    {{vm.specifiedRegion.percentsByManagementType[houseManagementType.code] | intanPercent:2}}</span>\n" +
    "                - {{houseManagementType.name}}\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    <div class=\"lHr _margin-10 _top _bottom\"></div>\n" +
    "\n" +
    "        <div class=\"row _margin-10 _bottom\">\n" +
    "            <div class=\"col-xs-12\">\n" +
    "                <span class=\"public-statistic-value\">{{vm.specifiedRegion.mkdCount | number}}</span>\n" +
    "                {{vm.getMkdCountMessage(vm.specifiedRegion.mkdCount)}}\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <h4 ng-show=\"!vm.specifiedRegion.value || !vm.specifiedRegion.mkdCount\" class=\"text-center _margin-30 _bottom\">\n" +
    "        В системе не размещено информации о домах, удовлетворяющих параметрам поиска.\n" +
    "        Попробуйте скорректировать параметры поиска.\n" +
    "    </h4>\n" +
    "\n" +
    "    <span class=\"arrow tipCorner\"></span>\n" +
    "</div>\n" +
    "");
}]);

angular.module("service-providers-data/components/service-providers-data-table.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("service-providers-data/components/service-providers-data-table.tpl.html",
    "<div>\n" +
    "    <table class=\"table-base table-bordered public-statistic-table\">\n" +
    "        <thead>\n" +
    "        <tr>\n" +
    "            <th class=\"text-center _nowrap\">№</th>\n" +
    "            <th class=\"text-center _nowrap grid-sorting\" ng-click=\"vm.sort('regionName')\">\n" +
    "                <span ng-class=\"vm.sortIndicatorClass('regionName')\">\n" +
    "                    Субъект РФ\n" +
    "                </span>\n" +
    "            </th>\n" +
    "            <th class=\"text-center grid-sorting\" ng-repeat=\"row in vm.rowTemplates\" ng-click=\"vm.sort(row.key)\">\n" +
    "                <span ng-class=\"vm.sortIndicatorClass(row.key)\">\n" +
    "                    {{row.header()}}\n" +
    "                </span>\n" +
    "            </th>\n" +
    "        </tr>\n" +
    "        </thead>\n" +
    "        <tbody>\n" +
    "        <tr>\n" +
    "            <td colspan=\"2\" class=\"bold _nowrap\">\n" +
    "                Итого по выбранным субъектам РФ\n" +
    "            </td>\n" +
    "            <td  class=\"text-center bold _nowrap\" ng-repeat=\"row in vm.rowTemplates\">\n" +
    "                    {{row.total(regions.totals)}}\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "\n" +
    "        <tr ng-repeat=\"region in vm.sortedData\">\n" +
    "            <td class=\"text-center _nowrap\">\n" +
    "                {{$index+1}}\n" +
    "            </td>\n" +
    "            <td class=\" _nowrap\">\n" +
    "                {{region.regionName}}\n" +
    "            </td>\n" +
    "            <td ng-repeat=\"row in vm.rowTemplates\" class=\"text-center _nowrap\">\n" +
    "                {{row.value(region)}}\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "    <div ng-transclude></div>\n" +
    "</div>");
}]);

angular.module("service-providers-data/service-providers-data-tables.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("service-providers-data/service-providers-data-tables.tpl.html",
    "<service-providers-data-table regions=\"vm.tableRegionsData\"\n" +
    "                              ng-if=\"vm.isStatisticType(vm.statisticType.AVG_CHARGED)\" >\n" +
    "    <service-providers-data-table-row header=\"Средняя величина начислений по услуге, {{vm.units}}\"\n" +
    "                                      key=\"avgCharged\"\n" +
    "                                      format=\"data | number: 2\"    ></service-providers-data-table-row>\n" +
    "    <service-providers-data-table-row header=\"Cредняя величина платы за коммунальные услуги по помещениям,\n" +
    "            в которых предоставляется услуга, {{vm.units}}\"\n" +
    "                                      key=\"avgTotal\"\n" +
    "                                      format=\"data | number: 2\"    ></service-providers-data-table-row>\n" +
    "    <service-providers-data-table-row header=\"Процент начислений, которые приходятся на услугу, %\"\n" +
    "                                      key=\"percentCharged\"\n" +
    "                                      format=\"data | number: 2\"    ></service-providers-data-table-row>\n" +
    "    <service-providers-data-table-row header=\"Кол-во помещений, участвовавших в расчете\"\n" +
    "                                      key=\"documentsCountAvgTotal\" ></service-providers-data-table-row>\n" +
    "</service-providers-data-table>\n" +
    "\n" +
    "<service-providers-data-table regions=\"vm.tableRegionsData\"\n" +
    "                              ng-if=\"vm.isStatisticType(vm.statisticType.AVG_INDIVIDUAL_CONSUMPTION)\">\n" +
    "    <service-providers-data-table-row header=\"Среднее индивидуальное потребление по услуге, {{vm.units}}\"\n" +
    "                                      key=\"avgIndividualConsumption\"\n" +
    "                                      format=\"data | number: 3\"\n" +
    "    ></service-providers-data-table-row>\n" +
    "    <service-providers-data-table-row header=\"Среднее потребление по услуге, {{vm.units}}\"\n" +
    "                                      key=\"avgOverallConsumption\"\n" +
    "                                      format=\"data | number: 3\"    ></service-providers-data-table-row>\n" +
    "    <service-providers-data-table-row header=\"Процент индивидуального потребления, %\"\n" +
    "                                      key=\"percentIndividualConsumption\"\n" +
    "                                      format=\"data | number: 2\"    ></service-providers-data-table-row>\n" +
    "    <service-providers-data-table-row header=\"Кол-во помещений, участвовавших в расчете\"\n" +
    "                                      key=\"documentsCountAvgOverallConsumption\" ></service-providers-data-table-row>\n" +
    "\n" +
    "</service-providers-data-table>\n" +
    "\n" +
    "<service-providers-data-table regions=\"vm.tableRegionsData\"\n" +
    "                              ng-if=\"vm.isStatisticType(vm.statisticType.AVG_HOUSE_CONSUMPTION)\">\n" +
    "    <service-providers-data-table-row header=\"Среднее потребление на общедомовые нужды по услуге, {{vm.units}}\"\n" +
    "                                      key=\"avgHouseConsumption\"\n" +
    "                                      format=\"data | number: 3\"\n" +
    "    ></service-providers-data-table-row>\n" +
    "    <service-providers-data-table-row header=\"Среднее потребление по услуге, {{vm.units}}\"\n" +
    "                                      key=\"avgOverallConsumption\"\n" +
    "                                      format=\"data | number: 3\"    ></service-providers-data-table-row>\n" +
    "    <service-providers-data-table-row header=\"Процент потребления на общедомовые нужды, %\"\n" +
    "                                      key=\"percentHouseConsumption\"\n" +
    "                                      format=\"data | number: 2\"    ></service-providers-data-table-row>\n" +
    "    <service-providers-data-table-row header=\"Кол-во помещений, участвовавших в расчете\"\n" +
    "                                      key=\"documentsCountAvgHouseConsumption\" ></service-providers-data-table-row>\n" +
    "</service-providers-data-table>\n" +
    "\n" +
    "<service-providers-data-table regions=\"vm.tableRegionsData\" ng-if=\"vm.isStatisticType(vm.statisticType.AVG_UNIT_COST)\">\n" +
    "    <service-providers-data-table-row header=\"Средняя стоимость за единицу услуги, {{vm.units}}\"\n" +
    "                                      key=\"avgServiceUnitCost\"\n" +
    "                                      format=\"data | number: 2\"    ></service-providers-data-table-row>\n" +
    "    <service-providers-data-table-row header=\"Кол-во услуг, участвовавших в расчете\"\n" +
    "                                      key=\"documentsCountAvgServiceUnitCost\" ></service-providers-data-table-row>\n" +
    "</service-providers-data-table>\n" +
    "\n" +
    "<service-providers-data-table regions=\"vm.tableRegionsData\" ng-if=\"vm.isStatisticType(vm.statisticType.AVG_TARIFF)\">\n" +
    "    <service-providers-data-table-row header=\"Средний тариф по услуге, {{vm.units}}\"\n" +
    "                                      key=\"avgTariff\"\n" +
    "                                      format=\"data | number: 2\"    ></service-providers-data-table-row>\n" +
    "    <service-providers-data-table-row header=\"Кол-во услуг, участвовавших в расчете\"\n" +
    "                                      key=\"documentsCountAvgTariff\" ></service-providers-data-table-row>\n" +
    "</service-providers-data-table>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("service-providers-data/service-providers-data.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("service-providers-data/service-providers-data.tpl.html",
    "<intan-widget-header page-title=\"vm.pageTitle\" breadcrumbs=\"vm.breadcrumbs\"\n" +
    "    info-date=\"vm.date\"></intan-widget-header>\n" +
    "\n" +
    "<div class=\"row _margin-10 _top\" ng-show=\"vm.totalAverageDescription\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <div class=\"intan-service-providers-data-total-value\">\n" +
    "            <div class=\"app-icon icon\" ng-class=\"vm.selectedStatisticType.totalAverageIcon\"></div>\n" +
    "\n" +
    "            <div class=\"text\">\n" +
    "                <div class=\"value\">\n" +
    "                    {{vm.totalAverage}} {{vm.units}}\n" +
    "                </div>\n" +
    "                <div class=\"description\">\n" +
    "                    {{vm.totalAverageDescription}} <br /> «{{vm.selectedServiceName}}»\n" +
    "                    <span ng-show=\"vm.isTwoComponentTariffResource()\">\n" +
    "                        , по коммунальному ресурсу «{{vm.selectedResourceName}}»</span> в РФ\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-3 margin-right-m-100\">\n" +
    "        <div class=\"intan-service-providers-data-legend\">\n" +
    "            <div class=\"intan-range\" ng-if=\"vm.legend\" ng-repeat=\"interval in vm.legend.intervals\">\n" +
    "                <div class=\"color intan-disk-30\" ng-style=\"{'background-color': interval.color}\"></div>\n" +
    "\n" +
    "                <div class=\"text\" ng-if=\"$first\">\n" +
    "                    до {{vm.legend.intervals[$index+1].startValue}} {{vm.units}}</div>\n" +
    "\n" +
    "                <div class=\"text\" ng-if=\"$middle\">\n" +
    "                    {{interval.startValue}} - {{interval.endValue}} {{vm.units}}</div>\n" +
    "\n" +
    "                <div class=\"text\" ng-if=\"$last\">\n" +
    "                    более {{vm.legend.intervals[$index-1].endValue}} {{vm.units}}</div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"intan-range\">\n" +
    "                <div class=\"color intan-disk-30 intan-bg-gray\"></div>\n" +
    "                <div class=\"text\">данные отсутствуют</div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-10 pull-right\"  ng-show=\"vm.hasData\">\n" +
    "        <intan-map\n" +
    "            regions=\"vm.regions\"\n" +
    "            on-mouse-over=\"vm.specifyRegion\"\n" +
    "            on-click=\"vm.selectRegion\"\n" +
    "            tooltip-id=\"service-providers-data-map-tip\">\n" +
    "        </intan-map>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<!--форма поиска-->\n" +
    "<div class=\"form-base _margin-10 _top\">\n" +
    "    <div class=\"form-base__body\">\n" +
    "        <!--Чекбоксы-->\n" +
    "        <div class=\"row form-base__row\">\n" +
    "            <label class=\"col-xs-1\">Отображать на карте:</label>\n" +
    "\n" +
    "            <div class=\"col-xs-4\">\n" +
    "                <div class=\"form-group form-base__form-group\">\n" +
    "                    <label class=\"col-xs-4 control-label form-base__control-label\">\n" +
    "                        По услуге</label>\n" +
    "\n" +
    "                    <div class=\"col-xs-8\">\n" +
    "                        <select ui-select2\n" +
    "                                class=\"form-control form-base__form-control\"\n" +
    "                                ng-model=\"vm.selectedServiceCode\"\n" +
    "                                data-placeholder=\"Выберите значение\"\n" +
    "                                ng-change=\"vm.getData()\">\n" +
    "\n" +
    "                            <option value=\"\"></option>\n" +
    "                            <option ng-repeat=\"munService in vm.munServiceCodes\"\n" +
    "                                    value=\"{{munService}}\">\n" +
    "                                {{vm.munServiceNames[munService]}}\n" +
    "                            </option>\n" +
    "                        </select>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "\n" +
    "                <div class=\"form-group form-base__form-group\">\n" +
    "                    <label class=\"col-xs-4 control-label form-base__control-label form-base__control-label_multi\">\n" +
    "                        За расчетный период</label>\n" +
    "\n" +
    "                    <div class=\"col-xs-8\">\n" +
    "                        <select ui-select2\n" +
    "                                class=\"form-control form-base__form-control\"\n" +
    "                                ng-model=\"vm.selectedMonthYear\"\n" +
    "                                data-placeholder=\"Выберите значение\"\n" +
    "                                ng-change=\"vm.getData()\">\n" +
    "\n" +
    "                            <option value=\"\"></option>\n" +
    "                            <option ng-repeat=\"monthYear in vm.monthYears\"\n" +
    "                                    value=\"{{monthYear}}\">\n" +
    "                                {{monthYear}}\n" +
    "                            </option>\n" +
    "                        </select>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"col-xs-3\">\n" +
    "                <div class=\"radio\">\n" +
    "                    <label class=\"control-label\">\n" +
    "                        <input type=\"radio\" ng-model=\"vm.selectedStatisticType\"\n" +
    "                               ng-value=\"vm.statisticType.AVG_CHARGED\"\n" +
    "                               ng-change=\"vm.getData()\" />\n" +
    "                        Средняя величина начисления по помещению\n" +
    "\n" +
    "                        <intan-info-tooltip tooltip-id=\"intan-avg-charged-tooltip\"></intan-info-tooltip>\n" +
    "                        <script type=\"text/ng-template\" id=\"intan-avg-charged-tooltip\">\n" +
    "                            <div class=\"hcs-popover-tooltip intan-service-providers-data-info-tooltip\">\n" +
    "                                Показатель рассчитывается как отношение суммы «Итого к оплате» по выбранной услуге\n" +
    "                                к количеству помещений, в которые предоставлялась выбранная услуга\n" +
    "                            </div>\n" +
    "                            <div class=\"triangle\"></div>\n" +
    "                        </script>\n" +
    "                    </label>\n" +
    "                </div>\n" +
    "                <div class=\"radio\">\n" +
    "                    <label class=\"control-label\">\n" +
    "                        <input type=\"radio\" ng-model=\"vm.selectedStatisticType\"\n" +
    "                               ng-value=\"vm.statisticType.AVG_INDIVIDUAL_CONSUMPTION\"\n" +
    "                               ng-change=\"vm.getData()\" />\n" +
    "                        Среднее индивидуальное потребление по помещению\n" +
    "\n" +
    "                        <intan-info-tooltip tooltip-id=\"intan-avg-individual-consumption-tooltip\"></intan-info-tooltip>\n" +
    "                        <script type=\"text/ng-template\" id=\"intan-avg-individual-consumption-tooltip\">\n" +
    "                            <div class=\"hcs-popover-tooltip intan-service-providers-data-info-tooltip\">\n" +
    "                                Показатель рассчитывается как отношение суммы объемов индивидуального потребления\n" +
    "                                по выбранной услуге к количеству помещений, в которые предоставлялась выбранная услуга\n" +
    "                            </div>\n" +
    "                            <div class=\"triangle\"></div>\n" +
    "                        </script>\n" +
    "                    </label>\n" +
    "                </div>\n" +
    "                <div class=\"radio\">\n" +
    "                    <label class=\"control-label\">\n" +
    "                        <input type=\"radio\" ng-model=\"vm.selectedStatisticType\"\n" +
    "                               ng-value=\"vm.statisticType.AVG_HOUSE_CONSUMPTION\"\n" +
    "                               ng-disabled=\"!vm.avgHouseConsumptionAvailable()\"\n" +
    "                               ng-change=\"vm.getData()\" />\n" +
    "                        Среднее потребление на общедомовые нужды по помещению\n" +
    "\n" +
    "                        <intan-info-tooltip tooltip-id=\"intan-avg-house-consumption-tooltip\"></intan-info-tooltip>\n" +
    "                        <script type=\"text/ng-template\" id=\"intan-avg-house-consumption-tooltip\">\n" +
    "                            <div class=\"hcs-popover-tooltip intan-service-providers-data-info-tooltip\" ng-if=\"vm.beforeJuly2017()\">\n" +
    "                                Показатель рассчитывается как отношение суммы объемов потребления на общедомовые нужды\n" +
    "                                по выбранной услуге к количеству помещений, в которые предоставлялась выбранная услуга\n" +
    "                            </div>\n" +
    "                            <div class=\"hcs-popover-tooltip intan-service-providers-data-info-tooltip\" ng-if=\"!vm.beforeJuly2017()\">\n" +
    "                                Показатель рассчитывается для многоквартирных домов со способом управления:\n" +
    "                                непосредственное, не выбран или не реализован, как отношение суммы объемов потребления\n" +
    "                                на общедомовые нужды по выбранной услуге к количеству помещений,\n" +
    "                                в которые предоставлялась выбранная услуга\n" +
    "                            </div>\n" +
    "                            <div class=\"triangle\"></div>\n" +
    "                        </script>\n" +
    "                    </label>\n" +
    "                </div>\n" +
    "                <div class=\"radio\">\n" +
    "                    <label class=\"control-label\">\n" +
    "                        <input type=\"radio\" ng-model=\"vm.selectedStatisticType\"\n" +
    "                               ng-value=\"vm.statisticType.AVG_UNIT_COST\"\n" +
    "                               ng-change=\"vm.getData()\" />\n" +
    "                        Средняя стоимость за единицу услуги\n" +
    "\n" +
    "                        <intan-info-tooltip tooltip-id=\"intan-avg-unit-cost-tooltip\"></intan-info-tooltip>\n" +
    "                        <script type=\"text/ng-template\" id=\"intan-avg-unit-cost-tooltip\">\n" +
    "                            <div class=\"hcs-popover-tooltip intan-service-providers-data-info-tooltip\">\n" +
    "                                Показатель рассчитывается как отношение суммы «Итого к оплате» по выбранной услуге\n" +
    "                                к сумме объемов потребления выбранной услуги\n" +
    "                            </div>\n" +
    "                            <div class=\"triangle\"></div>\n" +
    "                        </script>\n" +
    "                    </label>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"col-xs-4\">\n" +
    "                <div class=\"radio\">\n" +
    "                    <label class=\"control-label\">\n" +
    "                        <input type=\"radio\" ng-model=\"vm.selectedStatisticType\"\n" +
    "                               ng-value=\"vm.statisticType.AVG_TARIFF\"\n" +
    "                               ng-change=\"vm.getData()\" />\n" +
    "                        Средний тариф по услуге\n" +
    "\n" +
    "                        <intan-info-tooltip tooltip-id=\"intan-avg-tariff-tooltip\"></intan-info-tooltip>\n" +
    "                        <script type=\"text/ng-template\" id=\"intan-avg-tariff-tooltip\">\n" +
    "                            <div class=\"hcs-popover-tooltip intan-service-providers-data-info-tooltip\">\n" +
    "                                Показатель рассчитывается как среднее арифметическое  тарифов по выбранной услуге и,\n" +
    "                                для двухкомпонентного тарифа, по выбранному ресурсу\n" +
    "                            </div>\n" +
    "                            <div class=\"triangle\"></div>\n" +
    "                        </script>\n" +
    "                    </label>\n" +
    "                </div>\n" +
    "                <div class=\"_padding-20 _left\">\n" +
    "                    <div class=\"radio\">\n" +
    "                        <label class=\"control-label\">\n" +
    "                            <input type=\"radio\" ng-model=\"vm.selectedTariffType\"\n" +
    "                                   ng-value=\"vm.tariffType.ONE_COMPONENT\"\n" +
    "                                   ng-disabled=\"!vm.isTariffType()\"\n" +
    "                                   ng-change=\"vm.getData()\" />\n" +
    "                            Однокомпонентный тариф\n" +
    "                        </label>\n" +
    "                    </div>\n" +
    "                    <div class=\"radio\">\n" +
    "                        <label class=\"control-label\">\n" +
    "                            <input type=\"radio\" ng-model=\"vm.selectedTariffType\"\n" +
    "                                   ng-value=\"vm.tariffType.TWO_COMPONENT\"\n" +
    "                                   ng-disabled=\"!vm.twoComponentTariffAvailable()\"\n" +
    "                                   ng-change=\"vm.getData()\" />\n" +
    "                            Двухкомпонентный тариф\n" +
    "\n" +
    "                            <intan-info-tooltip tooltip-id=\"intan-two-component-tariff-tooltip\"></intan-info-tooltip>\n" +
    "                            <script type=\"text/ng-template\" id=\"intan-two-component-tariff-tooltip\">\n" +
    "                                <div class=\"hcs-popover-tooltip intan-service-providers-data-info-tooltip\">\n" +
    "                                    Двухкомпонентный тариф применяется для услуги «Горячее водоснабжение»\n" +
    "                                    и состоит из компонента на холодную воду (теплоноситель)\n" +
    "                                    и компонента на тепловую энергию\n" +
    "                                </div>\n" +
    "                                <div class=\"triangle\"></div>\n" +
    "                            </script>\n" +
    "                        </label>\n" +
    "                    </div>\n" +
    "\n" +
    "                    <div class=\"form-group form-base__form-group _margin-5 _top\">\n" +
    "                        <label class=\"col-xs-4 control-label form-base__control-label_multi\">\n" +
    "                            Коммунальный ресурс</label>\n" +
    "\n" +
    "                        <div class=\"col-xs-8\">\n" +
    "                            <select ui-select2\n" +
    "                                    class=\"form-control form-base__form-control\"\n" +
    "                                    ng-model=\"vm.selectedResourceCode\"\n" +
    "                                    data-placeholder=\"Выберите значение\"\n" +
    "                                    ng-disabled=\"!vm.munResourceAvailable()\"\n" +
    "                                    ng-change=\"vm.getResourceData()\">\n" +
    "\n" +
    "                                <option value=\"\"></option>\n" +
    "                                <option ng-repeat=\"munResource in vm.munResourceCodes\"\n" +
    "                                        value=\"{{munResource}}\">\n" +
    "                                    {{vm.munResourceNames[munResource]}}\n" +
    "                                </option>\n" +
    "                            </select>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-xs-12  _margin-10 _bottom\">\n" +
    "                <span class=\"intan-annotation\">Примечание: Показатели рассчитаны на основании информации о платежных документах,\n" +
    "                    размещенных в ГИС ЖКХ</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <br>\n" +
    "    </div>\n" +
    "    <!--Выбор регионов-->\n" +
    "    <div class=\"form-base__body bg-color_gray-light\">\n" +
    "        <div class=\"row form-base__row\">\n" +
    "            <div class=\"col-xs-12 _margin-20 _top\">\n" +
    "                <div class=\"form-group form-base__form-group\">\n" +
    "                    <label class=\"col-xs-3  control-label form-base__control-label form-base__control-label_multi\">\n" +
    "                        Отобразить в таблице информацию по субъекту РФ\n" +
    "                    </label>\n" +
    "                    <div class=\"col-xs-9 form-group form-base__form-group\">\n" +
    "\n" +
    "                        <multiselect2\n" +
    "                                class=\"form-control form-base__form-control\"\n" +
    "                                ng-model=\"vm.selectedRegions\"\n" +
    "                                options=\"vm.regionSelectOptions\"\n" +
    "                                on-change=\"vm.selectRegions\"\n" +
    "                                required=\"true\">\n" +
    "                        </multiselect2>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "<!-- таблички -->\n" +
    "<div class=\"row\" ng-if=\"vm.hasData\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <ng-include src=\"'service-providers-data/service-providers-data-tables.tpl.html'\"></ng-include>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<!--легенда карты -->\n" +
    "<div id=\"service-providers-data-map-tip\" class=\"popover top intan-tooltip intan-map-tooltip\">\n" +
    "    <div class=\"header\">\n" +
    "        {{vm.specifiedRegion.name}}\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"separator\"></div>\n" +
    "\n" +
    "    <div ng-show=\"vm.specifiedRegion.documents\">\n" +
    "        <div class=\"row top\" ng-show=\"vm.isStatisticType(vm.statisticType.AVG_CHARGED)\">\n" +
    "            <div class=\"col-xs-3\">\n" +
    "                <div class=\"value\" ng-style=\"{'background-color': vm.specifiedRegion.fill}\">\n" +
    "                {{vm.specifiedRegion.avgCharged}} {{vm.units}}\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                Средняя величина начислений по услуге «{{vm.selectedServiceName}}»\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row top\" ng-show=\"vm.isStatisticType(vm.statisticType.AVG_INDIVIDUAL_CONSUMPTION)\">\n" +
    "            <div class=\"col-xs-3  _padding-0 _right\">\n" +
    "                <div  class=\"value\" ng-style=\"{'background-color': vm.specifiedRegion.fill}\">\n" +
    "                {{vm.specifiedRegion.avgIndividualConsumption}} {{vm.units}}\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                Среднее индивидуальное потребление по услуге «{{vm.selectedServiceName}}»*\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row top\" ng-show=\"vm.isStatisticType(vm.statisticType.AVG_HOUSE_CONSUMPTION)\">\n" +
    "            <div class=\"col-xs-3  _padding-0 _right\" >\n" +
    "                <div class=\"value\" ng-style=\"{'background-color': vm.specifiedRegion.fill}\">\n" +
    "                {{vm.specifiedRegion.avgHouseConsumption}} {{vm.units}}\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                Среднее потребление на общедомовые нужды по услуге «{{vm.selectedServiceName}}»*\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row top\" ng-show=\"vm.isStatisticType(vm.statisticType.AVG_UNIT_COST)\">\n" +
    "            <div class=\"col-xs-4  _padding-0 _right\">\n" +
    "                <div class=\"value\" ng-style=\"{'background-color': vm.specifiedRegion.fill}\">\n" +
    "                    {{vm.specifiedRegion.avgServiceUnitCost}} {{vm.units}}\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-8\">\n" +
    "                Средняя стоимость за единицу услуги «{{vm.selectedServiceName}}»\n" +
    "                <span ng-show=\"vm.isTwoComponentTariffResource()\">\n" +
    "                    , коммунальному ресурсу «{{vm.selectedResourceName}}»</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row top\" ng-show=\"vm.isStatisticType(vm.statisticType.AVG_TARIFF)\">\n" +
    "            <div class=\"col-xs-4  _padding-0 _right\">\n" +
    "                <div class=\"value\" ng-style=\"{'background-color': vm.specifiedRegion.fill}\">\n" +
    "                    {{vm.specifiedRegion.avgTariff}} {{vm.units}}\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-8\">\n" +
    "                Средний тариф по услуге «{{vm.selectedServiceName}}»\n" +
    "                <span ng-show=\"vm.isTwoComponentTariffResource()\">\n" +
    "                    , коммунальному ресурсу «{{vm.selectedResourceName}}»</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    <div class=\"separator\"></div>\n" +
    "\n" +
    "        <div class=\"row\" ng-show=\"vm.isStatisticType(vm.statisticType.AVG_CHARGED)\">\n" +
    "            <div class=\"col-xs-3 text-right\">\n" +
    "                <span class=\"bold\">\n" +
    "                    {{vm.specifiedRegion.avgTotal}} {{vm.units}}\n" +
    "                </span>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                Средняя величина платы за коммунальные услуги по помещениям,\n" +
    "                в которых предоставляется услуга «{{vm.selectedServiceName}}»\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\" ng-show=\"vm.isStatisticType(vm.statisticType.AVG_CHARGED)\">\n" +
    "            <div class=\"col-xs-3\"></div>\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                <span class=\"bold\">\n" +
    "                    {{vm.specifiedRegion.percentCharged}}%\n" +
    "                </span>\n" +
    "                &emsp;\n" +
    "                начислений приходятся на услугу «{{vm.selectedServiceName}}»\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\" ng-show=\"vm.isStatisticType(vm.statisticType.AVG_INDIVIDUAL_CONSUMPTION) ||\n" +
    "            vm.isStatisticType(vm.statisticType.AVG_HOUSE_CONSUMPTION)\">\n" +
    "            <div class=\"col-xs-3  _padding-0 _right text-right\">\n" +
    "                <span class=\"bold\">{{vm.specifiedRegion.avgOverallConsumption}} {{vm.units}}</span>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                Среднее потребление по услуге «{{vm.selectedServiceName}}» за расчетный период, из него:\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\" ng-show=\"vm.isStatisticType(vm.statisticType.AVG_INDIVIDUAL_CONSUMPTION)\">\n" +
    "            <div class=\"col-xs-3\"></div>\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                <span class=\"bold\">\n" +
    "                    {{vm.specifiedRegion.percentIndividualConsumption}}%\n" +
    "                </span>&emsp;\n" +
    "                <span class=\"public-statistic-value\"></span>\n" +
    "                индивидуального потребления\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\" ng-show=\"vm.isStatisticType(vm.statisticType.AVG_HOUSE_CONSUMPTION)\">\n" +
    "            <div class=\"col-xs-3\">\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                <span class=\"bold\">\n" +
    "                    {{vm.specifiedRegion.percentHouseConsumption}}%\n" +
    "                    </span>&emsp;\n" +
    "                потребления на общедомовые нужды\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"separator\" ng-show=\"!vm.isTariffType()\" ></div>\n" +
    "\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"text-right\"\n" +
    "                ng-class=\"{\n" +
    "                'col-xs-4': vm.isCostStatistic(),\n" +
    "                'col-xs-3': !vm.isCostStatistic(),\n" +
    "                }\"\n" +
    "            >\n" +
    "                <span class=\"bold\">{{vm.specifiedRegion.documents}}</span>\n" +
    "            </div>\n" +
    "            <div ng-class=\"{\n" +
    "                'col-xs-8': vm.isCostStatistic(),\n" +
    "                'col-xs-9': !vm.isCostStatistic(),\n" +
    "                }\">\n" +
    "                    {{vm.getDocumentsText(vm.specifiedRegion.documents)}}\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row _margin-10\" ng-show=\"vm.isSelectedHotWaterService() &&\n" +
    "                (vm.isStatisticType(vm.statisticType.AVG_INDIVIDUAL_CONSUMPTION) || vm.isStatisticType(vm.statisticType.AVG_HOUSE_CONSUMPTION))\">\n" +
    "\n" +
    "            <div class=\"col-xs-12\">\n" +
    "                <span class=\"intan-annotation\"><span class=\"_red\">*</span> Примечание: В случае двухкомпонентного тарифа учитывается\n" +
    "                    объем только потребляемого ресурса</span>\n" +
    "            </div>\n" +
    "            <br>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <h4 ng-show=\"!vm.specifiedRegion.documents\" class=\"text-center\">Нет данных</h4>\n" +
    "\n" +
    "    <span class=\"arrow\"></span>\n" +
    "</div>\n" +
    "");
}]);

angular.module("shared/intan-territory-select/intan-territory-select.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("shared/intan-territory-select/intan-territory-select.tpl.html",
    "<div class=\"modal-base\">\n" +
    "    <div class=\"modal-header modal-base__header\">\n" +
    "        <ng-close-button ng-click=\"vm.discard()\"></ng-close-button>\n" +
    "\n" +
    "        <h3 class=\"modal-base__header-title\">\n" +
    "            Выберите территорию</h3>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"modal-body\">\n" +
    "        <div class=\"form-base\">\n" +
    "            <div class=\"form-base__body\">\n" +
    "                <div class=\"form-group form-base__form-group\">\n" +
    "                    <label class=\"col-xs-4 control-label form-base__control-label\">\n" +
    "                        Деление</label>\n" +
    "\n" +
    "                    <div class=\"col-xs-8\">\n" +
    "                        <div class=\"radio\">\n" +
    "                            <label>\n" +
    "                                <input type=\"radio\"\n" +
    "                                       ng-model=\"vm.selectedDivision\"\n" +
    "                                       ng-value=\"vm.division.fias\" />\n" +
    "                                Административно-территориальное\n" +
    "                            </label>\n" +
    "                        </div>\n" +
    "                        <div class=\"radio\">\n" +
    "                            <label>\n" +
    "                                <input type=\"radio\"\n" +
    "                                       ng-model=\"vm.selectedDivision\"\n" +
    "                                       ng-value=\"vm.division.oktmo\" />\n" +
    "                                Муниципальное\n" +
    "                            </label>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div ng-show=\"vm.isFiasDivision()\">\n" +
    "            <ef-pa-form-2\n" +
    "                filter=\"vm.fiasForm.filter\"\n" +
    "                field-params=\"vm.fiasForm.fieldParams\">\n" +
    "            </ef-pa-form-2>\n" +
    "        </div>\n" +
    "\n" +
    "        <div ng-show=\"vm.isOktmoDivision()\">\n" +
    "            <ef-poktmo-rp-form\n" +
    "                show-all-level-config=\"vm.oktmoForm.showAllLevelConfig\"\n" +
    "                search-parameters=\"vm.oktmoForm.searchParameters\"\n" +
    "                default-search-parameters=\"vm.oktmoForm.defaultSearchParameters\"\n" +
    "                field-params=\"vm.oktmoForm.fieldParams\">\n" +
    "            </ef-poktmo-rp-form>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"modal-footer\">\n" +
    "        <button class=\"btn btn-cancel\" ng-click=\"vm.discard()\">\n" +
    "            Отменить</button>\n" +
    "\n" +
    "        <button class=\"btn btn-action\" ng-click=\"vm.select()\"\n" +
    "            ng-disabled=\"!vm.selectAvailable()\">\n" +
    "            Выбрать</button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("shared/intan-year-interval/intan-year-interval.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("shared/intan-year-interval/intan-year-interval.tpl.html",
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-5\">\n" +
    "        <hcs-datepicker ng-model=\"yearFrom\" options=\"hcsDatepickerOptions\"></hcs-datepicker>\n" +
    "    </div>\n" +
    "    <div class=\"col-xs-2 text-center _padding-5 _top\">&mdash;</div>\n" +
    "    <div class=\"col-xs-5\">\n" +
    "        <hcs-datepicker ng-model=\"yearTo\" options=\"hcsDatepickerOptions\"></hcs-datepicker>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\" ng-show=\"isInvalid\">\n" +
    "    <div class=\"col-xs-12 _padding-20 _left\">\n" +
    "        <span class=\"text-danger\">Дата начала периода не может быть больше даты окончания периода</span>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("shared/rzslider-custom/rzslider-custom.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("shared/rzslider-custom/rzslider-custom.tpl.html",
    "<div class=\"rzslider-custom\">\n" +
    "    <span class=\"rz-bar-wrapper\"><span class=\"rz-bar-custom\"></span></span> <!-- // 0 The slider bar -->\n" +
    "    <span class=\"rz-bar-wrapper\">\n" +
    "  <span class=\"rz-bar rz-selection\" ng-style=\"barStyle\"></span>\n" +
    "</span> <!-- // 1 Highlight between two handles -->\n" +
    "    <span class=\"rz-pointer rz-pointer-min\" ng-style=minPointerStyle></span> <!-- // 2 Left slider handle -->\n" +
    "    <span class=\"rz-pointer rz-pointer-max\" ng-style=maxPointerStyle></span> <!-- // 3 Right slider handle -->\n" +
    "    <span class=\"rz-bubble rz-limit rz-floor\"></span> <!-- // 4 Floor label -->\n" +
    "    <span class=\"rz-bubble rz-limit rz-ceil\"></span> <!-- // 5 Ceiling label -->\n" +
    "    <span class=\"rz-tooltip\"></span> <!-- // 6 Label above left slider handle -->\n" +
    "    <span class=\"rz-tooltip\"></span> <!-- // 7 Label above right slider handle -->\n" +
    "    <span class=\"rz-tooltip\"></span> <!-- // 8 Range label when the slider handles are close ex. 15 - 17 -->\n" +
    "    <ul ng-show=\"showTicks\" class=\"rz-ticks\"> <!-- // 9 The ticks -->\n" +
    "        <li ng-repeat=\"t in ticks track by $index\" class=\"rz-tick\"\n" +
    "            ng-class=\"{'rz-selected': t.selected}\" ng-style=\"t.style\"\n" +
    "            ng-attr-uib-tooltip=\"{{ t.tooltip }}\" ng-attr-tooltip-placement=\"{{t.tooltipPlacement}}\"\n" +
    "            ng-attr-tooltip-append-to-body=\"{{ t.tooltip ? true : undefined}}\">\n" +
    "    <span ng-if=\"t.value != null\" class=\"rz-tick-value\"\n" +
    "          ng-attr-uib-tooltip=\"{{ t.valueTooltip }}\"\n" +
    "          ng-attr-tooltip-placement=\"{{t.valueTooltipPlacement}}\">{{ t.value }}</span>\n" +
    "            <span ng-if=\"t.legend != null\" class=\"rz-tick-legend\">{{ t.legend }}</span>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "</div>\n" +
    "");
}]);

angular.module("wdgt-contribution-size-2/wdgt-contribution-size-2.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("wdgt-contribution-size-2/wdgt-contribution-size-2.tpl.html",
    "<intan-widget-header page-title=\"vm.pageTitle\" breadcrumbs=\"vm.breadcrumbs\"\n" +
    "    info-date=\"vm.date\"></intan-widget-header>\n" +
    "\n" +
    "<div class=\"row\" ng-if=\"vm.regions\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <h5>\n" +
    "            <span class=\"public-statistic-value\">{{vm.weightedAverageChargedByTotalArea | currency:'руб./кв.м.'}} </span>\n" +
    "            Средневзвешенный размер взноса на капитальный ремонт по России\n" +
    "        </h5>\n" +
    "\n" +
    "        <h5>\n" +
    "            <span class=\"public-statistic-value\">{{vm.averageCharged | currency:'руб./кв.м.'}} </span>\n" +
    "            Средняя арифметическая величина взноса на капитальный ремонт по России\n" +
    "        </h5>\n" +
    "\n" +
    "        <h4 class=\"_padding-20 _top\">Средний размер взноса на капитальный ремонт</h4>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row _padding-20 _bottom\">\n" +
    "    <div class=\"col-xs-3\">\n" +
    "        <ul class=\"public-statistic-legend\">\n" +
    "            <li ng-repeat=\"range in vm.ranges\">\n" +
    "                <span class=\"legend-ico\" ng-class=\"range.style\"></span>\n" +
    "                <span class=\"legend-txt\">{{range.name}}</span>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-9\">\n" +
    "        <intan-map\n" +
    "            regions=\"vm.regions\"\n" +
    "            on-mouse-over=\"vm.setRegion\"\n" +
    "            tooltip-id=\"public-statistic-region-map-tip\">\n" +
    "        </intan-map>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<ef-bp-form no-search-btn=\"true\">\n" +
    "    <div class=\"form-base\"><div class=\"form-base__body\">\n" +
    "        <ng-form class=\"form-horizontal\" role=\"form\">\n" +
    "            <div class=\"row form-base__row\">\n" +
    "                <div class=\"col-xs-12 form-base_pad_light\">\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <label class=\"col-xs-2\">Отображать на карте:</label>\n" +
    "\n" +
    "                        <label class=\"col-xs-2 control-label form-base__control-label\">\n" +
    "                            За расчетный период</label>\n" +
    "\n" +
    "                        <div class=\"col-xs-2\">\n" +
    "                            <select ui-select2\n" +
    "                                    class=\"form-control form-base__form-control\"\n" +
    "                                    ng-model=\"vm.searchParams.monthYear\"\n" +
    "                                    data-placeholder=\"Выберите значение\"\n" +
    "                                    ng-change=\"vm.search()\">\n" +
    "\n" +
    "                                <option value=\"\"></option>\n" +
    "                                <option ng-repeat=\"monthYear in vm.monthYears\"\n" +
    "                                        value=\"{{monthYear}}\">\n" +
    "                                    {{monthYear}}\n" +
    "                                </option>\n" +
    "                            </select>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </ng-form>\n" +
    "    </div></div>\n" +
    "</ef-bp-form>\n" +
    "\n" +
    "<div id=\"public-statistic-region-map-tip\"\n" +
    "     class=\"public-statistic-region-map-tip popover top form-base form-base__body _padding-0 _top roboto\">\n" +
    "    <div>\n" +
    "        <a href=\"\" class=\"cnt-link text-center\">\n" +
    "            <h4 class=\"tip-popover-title roboto\">{{vm.region.name}}</h4>\n" +
    "        </a>\n" +
    "        <div class=\"lHr _padding-5 _top _bottom\"></div>\n" +
    "    </div>\n" +
    "\n" +
    "    <h5 ng-if=\"vm.regionValueAvailable()\">\n" +
    "        <span class=\"public-statistic-value\">{{vm.region.value | currency:'руб./кв.м.'}} </span>\n" +
    "        Средневзвешенный размер взноса на капитальный ремонт по субъекту\n" +
    "    </h5>\n" +
    "\n" +
    "    <h5 ng-if=\"vm.percentAvailable()\">\n" +
    "        <span class=\"public-statistic-value\">{{vm.region.percent}}% </span>\n" +
    "        Составляет от средневзвешенного размера взноса на капитальный ремонт по России\n" +
    "    </h5>\n" +
    "\n" +
    "    <h5 ng-if=\"vm.region.documentCount\">\n" +
    "        <div class=\"lHr _padding-5 _bottom\"></div>\n" +
    "        <span class=\"public-statistic-value\">{{vm.region.documentCount}} </span>\n" +
    "        {{vm.numeralCoherentText(vm.region.documentCount,\n" +
    "            'платежный документ, содержащий начисление по услуге \"Капитальный ремонт\", участвовал в расчете',\n" +
    "            'платежных документа, содержащих начисление по услуге \"Капитальный ремонт\", участвовало в расчете',\n" +
    "            'платежных документов, содержащих начисление по услуге \"Капитальный ремонт\", участвовало в расчете'\n" +
    "        )}}\n" +
    "    </h5>\n" +
    "\n" +
    "    <h4 ng-if=\"!vm.regionValueAvailable() && !percentAvailable() && !vm.region.documentCount\"\n" +
    "        class=\"text-center\">Нет данных</h4>\n" +
    "\n" +
    "    <span class=\"arrow tipCorner\"></span>\n" +
    "</div>\n" +
    "");
}]);

angular.module("wdgt-contribution-size/wdgt-contribution-size.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("wdgt-contribution-size/wdgt-contribution-size.tpl.html",
    "<intan-widget-header page-title=\"vm.pageTitle\" breadcrumbs=\"vm.breadcrumbs\"\n" +
    "    info-date=\"vm.date\"></intan-widget-header>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <h5>\n" +
    "            <span class=\"public-statistic-value\">{{vm.contributionSizeData.tariffGovAverage}} р/кв.м</span>\n" +
    "            Средний размер взноса на капитальный ремонт, утвержденный органами государственной власти по России\n" +
    "        </h5>\n" +
    "\n" +
    "        <h5>\n" +
    "            <span class=\"public-statistic-value\">{{vm.contributionSizeData.tariffOwnAverage}} р/кв.м</span>\n" +
    "            Средний размер взноса на капитальный ремонт, установленный собственниками\n" +
    "        </h5>\n" +
    "\n" +
    "        <h4 ng-if=\"vm.selectedSrcType === vm.wdgtContributionSizeSrcType.TARIFF_GOV.code\" class=\"_padding-20 _top\">\n" +
    "            Средний размер взноса на капитальный ремонт, утвержденный органами  государственной власти\n" +
    "        </h4>\n" +
    "\n" +
    "        <h4 ng-if=\"vm.selectedSrcType === vm.wdgtContributionSizeSrcType.TARIFF_OWN.code\" class=\"_padding-20 _top\">\n" +
    "            Средний размер взноса на капитальный ремонт, установленный собственниками\n" +
    "        </h4>\n" +
    "\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-3\">\n" +
    "        <ul class=\"public-statistic-legend\">\n" +
    "            <li ng-repeat=\"range in vm.ranges\">\n" +
    "                <span class=\"legend-ico\" ng-class=\"range.style\"></span>\n" +
    "                <span class=\"legend-txt\">{{range.begin}} - {{range.end}} р/кв.м</span>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <span class=\"legend-ico wlico1\"></span>\n" +
    "                <span class=\"legend-txt0\">Нет данных</span>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-9\">\n" +
    "        <intan-map\n" +
    "            regions=\"vm.regions\"\n" +
    "            on-mouse-over=\"vm.setRegion\"\n" +
    "            tooltip-id=\"public-statistic-region-map-tip\">\n" +
    "        </intan-map>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<ef-bp-form no-search-btn=\"true\">\n" +
    "    <div class=\"form-base\"><div class=\"form-base__body\">\n" +
    "        <ng-form class=\"form-horizontal\" role=\"form\">\n" +
    "            <div class=\"row form-base__row\">\n" +
    "                <div class=\"col-xs-12 form-base_pad_light\">\n" +
    "                    <div class=\"form-group form-base__form-group\">\n" +
    "                        <label class=\"col-xs-2\">Отображать на карте:</label>\n" +
    "                        <div class=\"col-xs-10\">\n" +
    "                            <div class=\"col-xs-6\">\n" +
    "                                <div class=\"col-xs-1\" style=\"padding: 8px\">\n" +
    "                                    <input\n" +
    "                                            id=\"tariff-gov-type\"\n" +
    "                                            type=\"radio\"\n" +
    "                                            name=\"type-group\"\n" +
    "                                            ng-click=\"vm.filterChanged(vm.wdgtContributionSizeSrcType.TARIFF_GOV.code)\"\n" +
    "                                            ng-model=\"vm.selectedSrcType\"\n" +
    "                                            ng-value=\"vm.wdgtContributionSizeSrcType.TARIFF_GOV.code\">\n" +
    "                                </div>\n" +
    "                                <label for=\"tariff-gov-type\" class=\"col-xs-11\" style=\"font-weight: normal\">\n" +
    "                                    Минимальный размер взноса на капитальный ремонт, утвержденный органами государственной власти\n" +
    "                                </label>\n" +
    "                            </div>\n" +
    "                            <div class=\"col-xs-6\">\n" +
    "                                <div class=\"col-xs-1\" style=\"padding: 15px\">\n" +
    "                                    <input\n" +
    "                                            id=\"tariff-own-type\"\n" +
    "                                            type=\"radio\"\n" +
    "                                            name=\"type-group\"\n" +
    "                                            ng-click=\"vm.filterChanged(vm.wdgtContributionSizeSrcType.TARIFF_OWN.code)\"\n" +
    "                                            ng-model=\"vm.selectedSrcType\"\n" +
    "                                            ng-value=\"vm.wdgtContributionSizeSrcType.TARIFF_OWN.code\">\n" +
    "                                </div>\n" +
    "                                <label for=\"tariff-own-type\" class=\"col-xs-11\" style=\"font-weight: normal\">\n" +
    "                                    Размер взноса на капитальный ремонт, установленный собственниками и превышающий минимальный размер взноса\n" +
    "                                </label>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </ng-form>\n" +
    "    </div></div>\n" +
    "</ef-bp-form>\n" +
    "\n" +
    "<div id=\"public-statistic-region-map-tip\"\n" +
    "     class=\"public-statistic-region-map-tip popover top form-base form-base__body _padding-0 _top roboto\">\n" +
    "    <div>\n" +
    "        <a href=\"\" class=\"cnt-link text-center\">\n" +
    "            <h4 class=\"tip-popover-title roboto\">{{vm.region.name}}</h4>\n" +
    "        </a>\n" +
    "        <div class=\"lHr _padding-5 _top _bottom\"></div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"row\" ng-if=\"vm.region.value\">\n" +
    "        <div class=\"col-xs-3\">\n" +
    "            <h5>\n" +
    "                <span class=\"public-statistic-value\">\n" +
    "                    {{vm.region.tariffGov}} р/кв.м\n" +
    "                </span>\n" +
    "            </h5>\n" +
    "        </div>\n" +
    "        <div class=\"col-xs-9\">\n" +
    "            <h5>\n" +
    "                Среднее значение минимального размера взноса на капитальный ремонт,\n" +
    "                утвержденного органами государственной власти\n" +
    "            </h5>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"row\" ng-if=\"vm.region.value\">\n" +
    "        <div class=\"col-xs-3\">\n" +
    "            <h5>\n" +
    "                <span class=\"public-statistic-value\">\n" +
    "                    {{vm.region.tariffOwn}} р/кв.м\n" +
    "                </span>\n" +
    "            </h5>\n" +
    "        </div>\n" +
    "        <div class=\"col-xs-9\">\n" +
    "            <h5>\n" +
    "                Среднее значение размера взноса на капитальный ремонт,\n" +
    "                установленного собственниками и превышающий минимальный размер взноса\n" +
    "            </h5>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"row\" ng-if=\"vm.region.ratio || vm.region.ratio == 0\">\n" +
    "        <div class=\"col-xs-12\">\n" +
    "            <h5>\n" +
    "                <!-- todo раз-раза, корректный вывод? -->\n" +
    "                Установленный собственниками размер превышает минимальный в {{vm.region.ratio}} раза\n" +
    "            </h5>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <h4 ng-if=\"!vm.region.value\" class=\"text-center\">Нет данных</h4>\n" +
    "\n" +
    "    <span class=\"arrow tipCorner\"></span>\n" +
    "</div>\n" +
    "");
}]);

angular.module("wdgt-mkd-control-method/wdgt-mkd-control-method.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("wdgt-mkd-control-method/wdgt-mkd-control-method.tpl.html",
    "<intan-widget-header page-title=\"vm.pageTitle\" breadcrumbs=\"vm.breadcrumbs\"\n" +
    "                     info-date=\"vm.date\"></intan-widget-header>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <h4><span class=\"public-statistic-value\">\n" +
    "            {{vm.totalStats.totalFactMkd | number}} ({{vm.totalStats.totalMkdFactPercent | intanPercent:2}})</span>\n" +
    "            МКД размещены в Системе по РФ, в том числе по способам управления:\n" +
    "\n" +
    "            <span class=\"app-icon app-icon_md app-icon_cl_prime whhg-info-sign\"\n" +
    "                  hcs-popover=\"\"\n" +
    "                  hcs-popover-template=\"intan-public-mkd-odpu-popover-tooltip\"\n" +
    "                  hcs-popover-trigger=\"mouseenter\"\n" +
    "                  hcs-popover-theme=\"hcs-popover-tooltip-theme\"\n" +
    "                  hcs-popover-placement=\"top|center\"\n" +
    "                  hcs-popover-timeout=\"0\"></span>\n" +
    "\n" +
    "            <script type=\"text/ng-template\" id=\"intan-public-mkd-odpu-popover-tooltip\">\n" +
    "                <div class=\"triangle\"></div>\n" +
    "                <div class=\"hcs-popover-tooltip intan-public-mkd-odpu-popover-tooltip\">\n" +
    "                    Процент размещенных МКД в Системе показывает соотношение количества размещенных многоквартирных домов:\n" +
    "                    <span class=\"public-statistic-value\">{{vm.totalStats.totalFactMkd | number}}</span>\n" +
    "                    и количества многоквартирных домов по данным, представленным органами государственной власти\n" +
    "                    субъектов РФ в сфере ЖКХ: <span class=\"public-statistic-value\">{{vm.totalStats.totalPlanMkd | number}}\n" +
    "                </div>\n" +
    "            </script>\n" +
    "        </h4>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-11 _padding-30 _left\">\n" +
    "\n" +
    "        <div class=\"row\" ng-if=\"vm.showByManagementOrganization\">\n" +
    "            <div class=\"col-xs-1 wdgt-mkd-control-method-number-data\">\n" +
    "                <span class=\"public-statistic-value h4 _margin-0\">\n" +
    "                    {{vm.totalStats.managementOrganization | number}}</span>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-7\">\n" +
    "                <span class=\"h4 _margin-0\">Управляющая организация</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\" ng-if=\"vm.showByManagementCooperative\">\n" +
    "            <div class=\"col-xs-1 wdgt-mkd-control-method-number-data\">\n" +
    "                <span class=\"public-statistic-value h4 _margin-0\">\n" +
    "                    {{vm.totalStats.cooperativeType | number}}</span>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-7\">\n" +
    "                <span class=\"h4 _margin-0\">ТСЖ, ЖСК, ЖК, иной кооператив</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\" ng-if=\"vm.showByDirectControl\">\n" +
    "            <div class=\"col-xs-1 wdgt-mkd-control-method-number-data\">\n" +
    "                <span class=\"public-statistic-value h4 _margin-0\">\n" +
    "                    {{vm.totalStats.directControl | number}}</span>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-7\">\n" +
    "                <span class=\"h4 _margin-0\">Непосредственное управление</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\" ng-if=\"vm.showByAnotherWay\">\n" +
    "            <div class=\"col-xs-2 wdgt-mkd-control-method-number-data\">\n" +
    "                <span class=\"public-statistic-value h4 _margin-0\">\n" +
    "                    {{vm.totalStats.controlMethod | number}}</span>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-7\">\n" +
    "                <span class=\"h4 _margin-0\">Не выбран</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\" ng-if=\"vm.showByUnknown\">\n" +
    "            <div class=\"col-xs-2 wdgt-mkd-control-method-number-data\">\n" +
    "                <span class=\"public-statistic-value h4 _margin-0\">\n" +
    "                    {{vm.totalStats.unpublishedControlMethod | number}}</span>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-7\">\n" +
    "                <span class=\"h4 _margin-0\">Информация о способе управления не размещена в системе</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-3 margin-right-m-100\">\n" +
    "        <div class=\"intan-range\" ng-repeat=\"range in vm.ranges\">\n" +
    "            <div class=\"color intan-disk-30\" ng-style=\"{'background-color': range.color}\"></div>\n" +
    "            <div class=\"text\">{{range.beginPrefix}} {{range.begin | intanPercent:2:(range.end ? '' : '%'):''}}\n" +
    "                {{range.endPrefix}} {{range.end | intanPercent:2:'%':''}}</div>\n" +
    "        </div>\n" +
    "        <div class=\"intan-range\">\n" +
    "            <div class=\"color intan-disk-30 intan-bg-blue\"></div>\n" +
    "            <div class=\"text\">нет данных <br /> по плановому <br /> количеству МКД</div>\n" +
    "        </div>\n" +
    "        <div class=\"intan-range\">\n" +
    "            <div class=\"color intan-disk-30 intan-bg-gray\"></div>\n" +
    "            <div class=\"text\">данные отсутствуют</div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-10 pull-right\">\n" +
    "        <intan-map\n" +
    "                regions=\"vm.mapData\"\n" +
    "                on-mouse-over=\"vm.setRegion\"\n" +
    "                tooltip-id=\"public-statistic-region-map-tip\">\n" +
    "        </intan-map>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div id=\"public-statistic-region-map-tip\"\n" +
    "     class=\"public-statistic-region-map-tip popover top form-base form-base__body _padding-0 _top roboto\">\n" +
    "\n" +
    "    <div class=\"_padding-5 _bottom\">\n" +
    "        <a href=\"\" class=\"cnt-link text-center\">\n" +
    "            <h4 class=\"tip-popover-title roboto\">{{vm.region.name}}</h4>\n" +
    "        </a>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"_padding-5 _bottom\" ng-if=\"vm.region.totalPlanMkd || vm.region.totalFactMkd\">\n" +
    "\n" +
    "        <div class=\"col-xs-12\">\n" +
    "            <div class=\"lHr _padding-5 _top _bottom\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "\n" +
    "        <div ng-if=\"!vm.onlyByUnknown()\">\n" +
    "\n" +
    "            <div class=\"col-xs-12\">\n" +
    "                <div class=\"col-xs-1 wdgt-mkd-control-method-number-data\">\n" +
    "                    <b><span class=\"public-statistic-value h5 _margin-0 text-bold\">\n" +
    "                    {{vm.region.mainValue | intanPercent: 2}}</span></b>\n" +
    "                </div>\n" +
    "                <div class=\"col-xs-9\">\n" +
    "                    <span class=\"h5 _margin-0\">Процент размещения МКД</span>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"col-xs-12 _padding-5 _top _bottom\">\n" +
    "                <div class=\"lHr\"></div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"col-xs-12\">\n" +
    "                <div class=\"col-xs-1 wdgt-mkd-control-method-number-data\">\n" +
    "                    <span class=\"public-statistic-value h5 _margin-0 text-bold\">\n" +
    "                    {{vm.region.totalPlanMkd | number}}</span>\n" +
    "                </div>\n" +
    "                <div class=\"col-xs-9\">\n" +
    "                    <span class=\"h5 _margin-0\">Плановое количество МКД, по данным представленным ОГВ субъектов РФ в сфере ЖКХ</span>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"col-xs-12 _padding-5 _top _bottom\">\n" +
    "                <div class=\"lHr\"></div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"col-xs-12 _padding-10 _bottom\">\n" +
    "                <div class=\"col-xs-1 wdgt-mkd-control-method-number-data\">\n" +
    "                    <span class=\"public-statistic-value h5 _margin-0 text-bold\">\n" +
    "                    {{vm.region.totalFactMkd | number}}</span>\n" +
    "                </div>\n" +
    "                <div class=\"col-xs-9\">\n" +
    "                    <span class=\"h5 _margin-0\">Количество МКД, размещенных в Системе</span>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"col-xs-12\" ng-if=\"vm.showByManagementOrganization\">\n" +
    "            <div class=\"col-xs-1 wdgt-mkd-control-method-number-data\">\n" +
    "                    <span class=\"public-statistic-value h5 _margin-0 text-bold\">\n" +
    "                    {{vm.region.factManagementOrganization | number}}</span>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                <span class=\"h5 _margin-0\">Управляющая организация</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"col-xs-12\" ng-if=\"vm.showByManagementCooperative\">\n" +
    "            <div class=\"col-xs-1 wdgt-mkd-control-method-number-data\">\n" +
    "                    <span class=\"public-statistic-value h5 _margin-0 text-bold\">\n" +
    "                    {{vm.region.factCooperativeType | number}}</span>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                <span class=\"h5 _margin-0\">ТСЖ, ЖСК, ЖК, иной кооператив</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"col-xs-12\" ng-if=\"vm.showByDirectControl\">\n" +
    "            <div class=\"col-xs-1 wdgt-mkd-control-method-number-data\">\n" +
    "                    <span class=\"public-statistic-value h5 _margin-0 text-bold\">\n" +
    "                    {{vm.region.factDirectControl | number}}</span>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                <span class=\"h5 _margin-0\">Непосредственное управление</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"col-xs-12\" ng-if=\"vm.showByAnotherWay\">\n" +
    "            <div class=\"col-xs-1 wdgt-mkd-control-method-number-data\">\n" +
    "                    <span class=\"public-statistic-value h5 _margin-0 text-bold\">\n" +
    "                    {{vm.region.factControlMethod | number}}</span>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                <span class=\"h5 _margin-0\">Не выбран</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"col-xs-12\" ng-if=\"vm.showByUnknown\">\n" +
    "            <div class=\"col-xs-1 wdgt-mkd-control-method-number-data\">\n" +
    "                    <span class=\"public-statistic-value h5 _margin-0 text-bold\">\n" +
    "                    {{vm.region.unpublishedControlMethod | number}}</span>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                <span class=\"h5 _margin-0\">Информация о способе управления не размещена в Cистеме</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <h4 ng-if=\"!vm.region.totalPlanMkd && !vm.region.totalFactMkd\"\n" +
    "        class=\"text-center\">Нет данных</h4>\n" +
    "\n" +
    "    <span class=\"arrow tipCorner\"></span>\n" +
    "</div>\n" +
    "\n" +
    "<ef-bp-form no-search-btn=\"true\">\n" +
    "    <div class=\"form-base\">\n" +
    "        <div class=\"form-base__body\">\n" +
    "            <form class=\"form-horizontal\" role=\"form\">\n" +
    "                <div class=\"row form-base__row\">\n" +
    "                    <label class=\"col-xs-2\">Отображать в таблице:</label>\n" +
    "\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <label class=\"col-xs-2 control-label form-base__control-label\">\n" +
    "                            По способу управления</label>\n" +
    "\n" +
    "                        <div class=\"col-xs-7\">\n" +
    "                            <multiselecttree\n" +
    "                                    multiple=\"true\"\n" +
    "                                    ng-model=\"vm.selectedManagementMethods\"\n" +
    "                                    all-select-ability=\"true\"\n" +
    "                                    options=\"c.name for c in vm.managementMethods\"\n" +
    "                                    change=\"vm.selectManagementMethods()\"\n" +
    "                                    header=\"vm.getManagementMethodsStatus()\"\n" +
    "                                    forMapRegistaraion=\"true\">\n" +
    "                            </multiselecttree>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "\n" +
    "                <div class=\"row form-base__row\">\n" +
    "                    <div class=\"col-xs-4\">\n" +
    "                        <div class=\"checkbox form-base__checkbox\">\n" +
    "                            <label class=\"_font-size-12\">\n" +
    "                                <input type=\"checkbox\" ng-model=\"vm.showPlan\"\n" +
    "                                       ng-disabled=\"vm.valueKindDisabled(vm.showPlan)\"/>\n" +
    "                                Отображать плановые данные\n" +
    "                            </label>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "\n" +
    "                    <div class=\"col-xs-4\">\n" +
    "                        <div class=\"checkbox form-base__checkbox\">\n" +
    "                            <label class=\"_font-size-12\">\n" +
    "                                <input type=\"checkbox\" ng-model=\"vm.showFact\"\n" +
    "                                       ng-disabled=\"vm.valueKindDisabled(vm.showFact)\"/>\n" +
    "                                Отображать фактические данные\n" +
    "                            </label>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "\n" +
    "                    <div class=\"col-xs-4\">\n" +
    "                        <div class=\"checkbox form-base__checkbox\">\n" +
    "                            <label class=\"_font-size-12\">\n" +
    "                                <input type=\"checkbox\" ng-model=\"vm.showPercent\"\n" +
    "                                       ng-disabled=\"vm.valueKindDisabled(vm.showPercent)\"/>\n" +
    "                                Отображать процент размещения информации\n" +
    "                            </label>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </form>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</ef-bp-form>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <div class=\"wdgt-mkd-control-method-ctrl-grid\" intan-grid-scroll=\"grid-scroll\">\n" +
    "            <div class=\"grid-header\" draggable=\"false\">\n" +
    "                <div class=\"grid-scroll\" draggable=\"false\">\n" +
    "                    <table class=\"grid-aside table-base table-bordered public-statistic-table\" intan-grid-aside-header>\n" +
    "                        <thead>\n" +
    "                        <tr>\n" +
    "                            <th class=\"first-column text-center\">\n" +
    "                                №\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"second-column grid-sorting text-center\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.name)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.name)\">\n" +
    "                                    Субъект Российской Федерации\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "                        </tr>\n" +
    "                        </thead>\n" +
    "                    </table>\n" +
    "\n" +
    "                    <table class=\"table-base table-bordered public-statistic-table\">\n" +
    "                        <thead>\n" +
    "                        <tr>\n" +
    "                            <th class=\"text-center\"\n" +
    "                                rowspan=\"{{vm.inTermsOfManagementMethods ? 2 : 1}}\"\n" +
    "                                colspan=\"{{vm.countValueKinds()}}\">\n" +
    "                                Всего многоквартирных домов\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"text-center\" colspan=\"{{vm.countValueKinds() * 4 + (vm.showFact ? 1 : 0)}}\"\n" +
    "                                ng-if=\"vm.inTermsOfManagementMethods\">\n" +
    "                                В разрезе способов управления\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"last-column grid-value\"\n" +
    "                                rowspan=\"{{vm.inTermsOfManagementMethods ? 3 : 2}}\">&nbsp;</th>\n" +
    "                        </tr>\n" +
    "\n" +
    "                        <tr ng-if=\"vm.inTermsOfManagementMethods\">\n" +
    "                            <!-- В разрезе способов управления -->\n" +
    "\n" +
    "                            <th class=\"text-center\" colspan=\"{{vm.countValueKinds()}}\"\n" +
    "                                ng-if=\"vm.showByDirectControl\">\n" +
    "                                Непосредственное управление\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"text-center\" colspan=\"{{vm.countValueKinds()}}\"\n" +
    "                                ng-if=\"vm.showByManagementOrganization\">\n" +
    "                                Управляющая организация\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"text-center\" colspan=\"{{vm.countValueKinds()}}\"\n" +
    "                                ng-if=\"vm.showByManagementCooperative\">\n" +
    "                                ТСЖ, ЖСК, ЖК, иной кооператив\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"text-center\" colspan=\"{{vm.countValueKinds()}}\"\n" +
    "                                ng-if=\"vm.showByAnotherWay\">\n" +
    "                                Не выбран или не реализован\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\" rowspan=\"2\"\n" +
    "                                ng-if=\"vm.showByUnknown && vm.showFact\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.unpublishedControlMethod)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.unpublishedControlMethod)\">\n" +
    "                                    Информация не размещена в системе\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "                        </tr>\n" +
    "\n" +
    "                        <tr>\n" +
    "                            <!-- Всего многоквартирных домов -->\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\"\n" +
    "                                ng-if=\"vm.showPlan\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.totalPlanMkd, vm.sorting.columns.mainValue,\n" +
    "                                    vm.sorting.columns.totalFactMkd)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.totalPlanMkd)\">\n" +
    "                                    План\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\"\n" +
    "                                ng-if=\"vm.showFact\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.totalFactMkd)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.totalFactMkd)\">\n" +
    "                                    Факт\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\"\n" +
    "                                ng-if=\"vm.showPercent\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.mainValue, vm.sorting.totalFactMkd)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.mainValue)\">\n" +
    "                                    %\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "\n" +
    "                            <!-- Непосредственное управление -->\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\"\n" +
    "                                ng-if=\"vm.showByDirectControl && vm.showPlan\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.planDirectControl,\n" +
    "                                    vm.sorting.columns.factDirectControlPercent, vm.sorting.columns.factDirectControl)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.planDirectControl)\">\n" +
    "                                    План\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\"\n" +
    "                                ng-if=\"vm.showByDirectControl && vm.showFact\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.factDirectControl)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.factDirectControl)\">\n" +
    "                                    Факт\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\"\n" +
    "                                ng-if=\"vm.showByDirectControl && vm.showPercent\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.factDirectControlPercent, vm.sorting.columns.factDirectControl)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.factDirectControlPercent)\">\n" +
    "                                    %\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "\n" +
    "                            <!-- Управляющая организация -->\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\"\n" +
    "                                ng-if=\"vm.showByManagementOrganization && vm.showPlan\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.planManagementOrganization,\n" +
    "                                    vm.sorting.columns.factManagementOrganizationPercent, vm.sorting.columns.factManagementOrganization)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.planManagementOrganization)\">\n" +
    "                                    План\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\"\n" +
    "                                ng-if=\"vm.showByManagementOrganization && vm.showFact\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.factManagementOrganization)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.factManagementOrganization)\">\n" +
    "                                    Факт\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\"\n" +
    "                                ng-if=\"vm.showByManagementOrganization && vm.showPercent\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.factManagementOrganizationPercent,\n" +
    "                                    vm.sorting.columns.factManagementOrganization)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.factManagementOrganizationPercent)\">\n" +
    "                                    %\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "\n" +
    "                            <!-- ТСЖ, ЖСК, ЖК, иной кооператив -->\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\"\n" +
    "                                ng-if=\"vm.showByManagementCooperative && vm.showPlan\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.planCooperativeType, vm.sorting.columns.factCooperativeTypePercent,\n" +
    "                                    vm.sorting.columns.factCooperativeType)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.planCooperativeType)\">\n" +
    "                                    План\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\"\n" +
    "                                ng-if=\"vm.showByManagementCooperative && vm.showFact\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.factCooperativeType)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.factCooperativeType)\">\n" +
    "                                    Факт\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\"\n" +
    "                                ng-if=\"vm.showByManagementCooperative && vm.showPercent\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.factCooperativeTypePercent, vm.sorting.columns.factCooperativeType)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.factCooperativeTypePercent)\">\n" +
    "                                    %\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "\n" +
    "                            <!-- Не выбран или не реализован -->\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\"\n" +
    "                                ng-if=\"vm.showByAnotherWay && vm.showPlan\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.planControlMethod,\n" +
    "                                    vm.sorting.columns.factControlMethodPercent, vm.sorting.columns.factControlMethod)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.planControlMethod)\">\n" +
    "                                    План\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\"\n" +
    "                                ng-if=\"vm.showByAnotherWay && vm.showFact\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.factControlMethod)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.factControlMethod)\">\n" +
    "                                    Факт\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "\n" +
    "                            <th class=\"grid-value grid-sorting text-center\"\n" +
    "                                ng-if=\"vm.showByAnotherWay && vm.showPercent\"\n" +
    "                                ng-click=\"vm.sorting.sort(vm.sorting.columns.factControlMethodPercent, vm.sorting.columns.factControlMethod)\">\n" +
    "                                <div ng-class=\"vm.sorting.getClass(vm.sorting.columns.factControlMethodPercent)\">\n" +
    "                                    %\n" +
    "                                </div>\n" +
    "                            </th>\n" +
    "                        </tr>\n" +
    "                        </thead>\n" +
    "                    </table>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"grid-body\">\n" +
    "                <div class=\"grid-scroll\">\n" +
    "                    <table class=\"grid-aside public-statistic-table table-base table-bordered\">\n" +
    "                        <tbody>\n" +
    "                        <tr>\n" +
    "                            <td class=\"first-column\">\n" +
    "                                1\n" +
    "                            </td>\n" +
    "                            <td class=\"second-column\">\n" +
    "                                <div class=\"round\">\n" +
    "                                    <div ng-class=\"vm.getRangeIcon(vm.regionTotal)\"></div>\n" +
    "                                </div>\n" +
    "                                Российская Федерация\n" +
    "                            </td>\n" +
    "                        </tr>\n" +
    "                        <tr ng-repeat=\"region in vm.tableData\">\n" +
    "                            <td class=\"first-column\">\n" +
    "                                {{$index + 2}}\n" +
    "                            </td>\n" +
    "                            <td class=\"second-column\">\n" +
    "                                <div class=\"round\">\n" +
    "                                    <div ng-class=\"vm.getRangeIcon(region)\"></div>\n" +
    "                                </div>\n" +
    "                                {{region.name}}\n" +
    "                            </td>\n" +
    "                        </tr>\n" +
    "                        </tbody>\n" +
    "                    </table>\n" +
    "\n" +
    "                    <table class=\"table-base table-bordered public-statistic-table\">\n" +
    "                        <tbody>\n" +
    "\n" +
    "                        <!-- РФ -->\n" +
    "\n" +
    "                        <tr>\n" +
    "                            <!-- Всего многоквартирных домов -->\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showPlan\">\n" +
    "                                {{vm.regionTotal.totalPlanMkd | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showFact\">\n" +
    "                                {{vm.regionTotal.totalFactMkd | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showPercent\">\n" +
    "                                {{vm.regionTotal.mainValue | intanPercent: 2 : ''}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <!-- Непосредственное управление -->\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByDirectControl && vm.showPlan\">\n" +
    "                                {{vm.regionTotal.planDirectControl | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByDirectControl && vm.showFact\">\n" +
    "                                {{vm.regionTotal.factDirectControl | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByDirectControl && vm.showPercent\">\n" +
    "                                {{vm.regionTotal.factDirectControlPercent | intanPercent: 2 : ''}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <!-- Управляющая организация -->\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByManagementOrganization && vm.showPlan\">\n" +
    "                                {{vm.regionTotal.planManagementOrganization | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByManagementOrganization && vm.showFact\">\n" +
    "                                {{vm.regionTotal.factManagementOrganization | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByManagementOrganization && vm.showPercent\">\n" +
    "                                {{vm.regionTotal.factManagementOrganizationPercent | intanPercent: 2 : ''}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <!-- ТСЖ, ЖСК, ЖК, иной кооператив -->\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByManagementCooperative && vm.showPlan\">\n" +
    "                                {{vm.regionTotal.planCooperativeType | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByManagementCooperative && vm.showFact\">\n" +
    "                                {{vm.regionTotal.factCooperativeType | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByManagementCooperative && vm.showPercent\">\n" +
    "                                {{vm.regionTotal.factCooperativeTypePercent | intanPercent: 2 : ''}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <!-- Не выбран или не реализован -->\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByAnotherWay && vm.showPlan\">\n" +
    "                                {{vm.regionTotal.planControlMethod | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByAnotherWay && vm.showFact\">\n" +
    "                                {{vm.regionTotal.factControlMethod | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByAnotherWay && vm.showPercent\">\n" +
    "                                {{vm.regionTotal.factControlMethodPercent | intanPercent: 2 : ''}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <!-- Информация не размещена в системе -->\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByUnknown && vm.showFact\">\n" +
    "                                {{vm.regionTotal.unpublishedControlMethod | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"last-column\">&nbsp;</td>\n" +
    "                        </tr>\n" +
    "\n" +
    "                        <!-- Регионы -->\n" +
    "\n" +
    "                        <tr ng-repeat=\"region in vm.tableData\">\n" +
    "                            <!-- Всего многоквартирных домов -->\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showPlan\">\n" +
    "                                {{region.totalPlanMkd | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showFact\">\n" +
    "                                {{region.totalFactMkd | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showPercent\">\n" +
    "                                {{region.mainValue  | intanPercent: 2 : ''}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <!-- Непосредственное управление -->\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByDirectControl && vm.showPlan\">\n" +
    "                                {{region.planDirectControl | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByDirectControl && vm.showFact\">\n" +
    "                                {{region.factDirectControl | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByDirectControl && vm.showPercent\">\n" +
    "                                {{region.factDirectControlPercent | intanPercent: 2 : ''}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <!-- Управляющая организация -->\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByManagementOrganization && vm.showPlan\">\n" +
    "                                {{region.planManagementOrganization | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByManagementOrganization && vm.showFact\">\n" +
    "                                {{region.factManagementOrganization | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByManagementOrganization && vm.showPercent\">\n" +
    "                                {{region.factManagementOrganizationPercent  | intanPercent: 2 : ''}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <!-- ТСЖ, ЖСК, ЖК, иной кооператив -->\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByManagementCooperative && vm.showPlan\">\n" +
    "                                {{region.planCooperativeType | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByManagementCooperative && vm.showFact\">\n" +
    "                                {{region.factCooperativeType | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByManagementCooperative && vm.showPercent\">\n" +
    "                                {{region.factCooperativeTypePercent | intanPercent: 2 : ''}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <!-- Не выбран или не реализован -->\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByAnotherWay && vm.showPlan\">\n" +
    "                                {{region.planControlMethod | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByAnotherWay && vm.showFact\">\n" +
    "                                {{region.factControlMethod | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByAnotherWay && vm.showPercent\">\n" +
    "                                {{region.factControlMethodPercent  | intanPercent: 2 : ''}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <!-- Информация не размещена в системе -->\n" +
    "\n" +
    "                            <td class=\"text-center\" ng-if=\"vm.showByUnknown && vm.showFact\">\n" +
    "                                {{region.unpublishedControlMethod | number}}\n" +
    "                            </td>\n" +
    "\n" +
    "                            <td class=\"last-column\">&nbsp;</td>\n" +
    "                        </tr>\n" +
    "                        </tbody>\n" +
    "                    </table>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <span class=\"intan-annotation _padding-10 _top\">\n" +
    "            *По данным, представленным органами государственной власти субъектов РФ в сфере ЖКХ</span>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("wdgt-municipal-services-charge/wdgt-municipal-services-charge.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("wdgt-municipal-services-charge/wdgt-municipal-services-charge.tpl.html",
    "<intan-widget-header page-title=\"vm.pageTitle\" breadcrumbs=\"vm.breadcrumbs\"\n" +
    "    info-date=\"vm.date\"></intan-widget-header>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <h5>\n" +
    "            <span class=\"public-statistic-value\"> {{vm.munCharge.average}} р.</span>\n" +
    "            Средний размер начислений за коммунальную услугу \"{{vm.munCharge.municipalServiceName}}\" по России\n" +
    "        </h5>\n" +
    "\n" +
    "        <h4 class=\"_padding-20 _top\">\n" +
    "            Средний размер начислений за коммунальную услугу \"{{vm.munCharge.municipalServiceName}}\"</h4>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-3\">\n" +
    "        <ul class=\"public-statistic-legend\">\n" +
    "            <li ng-repeat=\"range in vm.ranges\">\n" +
    "                <span class=\"legend-ico\" ng-class=\"range.style\"></span>\n" +
    "                <span class=\"legend-txt\">{{range.begin}} - {{range.end}} р.</span>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <span class=\"legend-ico wlico1\"></span>\n" +
    "                <span class=\"legend-txt0\">Нет данных</span>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-9\">\n" +
    "        <intan-map\n" +
    "            regions=\"vm.regions\"\n" +
    "            on-mouse-over=\"vm.setRegion\"\n" +
    "            on-click=\"vm.getOktmoCharges\"\n" +
    "            tooltip-id=\"public-statistic-region-map-tip\">\n" +
    "        </intan-map>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<ef-bp-form no-search-btn=\"true\">\n" +
    "    <div class=\"form-base\"><div class=\"form-base__body\">\n" +
    "        <ng-form class=\"form-horizontal\" role=\"form\">\n" +
    "            <div class=\"row form-base__row\">\n" +
    "                <div class=\"col-xs-12 form-base_pad_light\">\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <label class=\"col-xs-2\">Отображать на карте:</label>\n" +
    "\n" +
    "                        <label class=\"col-xs-2 control-label form-base__control-label\">\n" +
    "                            За расчетный период</label>\n" +
    "\n" +
    "                        <div class=\"col-xs-3\">\n" +
    "                            <select ui-select2\n" +
    "                                    class=\"form-control form-base__form-control\"\n" +
    "                                    ng-model=\"vm.searchParams.monthYear\"\n" +
    "                                    data-placeholder=\"Выберите значение\"\n" +
    "                                    ng-change=\"vm.search()\">\n" +
    "\n" +
    "                                <option value=\"\"></option>\n" +
    "                                <option ng-repeat=\"monthYear in vm.monthYears\"\n" +
    "                                        value=\"{{monthYear}}\">\n" +
    "                                    {{monthYear}}\n" +
    "                                </option>\n" +
    "                            </select>\n" +
    "                        </div>\n" +
    "\n" +
    "                        <label class=\"col-xs-2 control-label form-base__control-label\">\n" +
    "                            По услуге</label>\n" +
    "\n" +
    "                        <div class=\"col-xs-3\">\n" +
    "                            <select ui-select2\n" +
    "                                    class=\"form-control form-base__form-control\"\n" +
    "                                    ng-model=\"vm.searchParams.munService\"\n" +
    "                                    data-placeholder=\"Выберите значение\"\n" +
    "                                    ng-disabled=\"!vm.munServiceSelectAvailable()\"\n" +
    "                                    ng-change=\"vm.search()\">\n" +
    "\n" +
    "                                <option value=\"\"></option>\n" +
    "                                <option ng-repeat=\"munService in vm.munServiceCodes\"\n" +
    "                                        value=\"{{munService}}\">\n" +
    "                                    {{vm.munServiceNames[munService]}}\n" +
    "                                </option>\n" +
    "                            </select>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </ng-form>\n" +
    "    </div></div>\n" +
    "</ef-bp-form>\n" +
    "\n" +
    "<div id=\"public-statistic-region-map-tip\"\n" +
    "     class=\"public-statistic-region-map-tip popover top form-base form-base__body _padding-0 _top roboto\">\n" +
    "    <div>\n" +
    "        <a href=\"\" class=\"cnt-link text-center\">\n" +
    "            <h4 class=\"tip-popover-title roboto\">{{vm.region.name}}</h4>\n" +
    "        </a>\n" +
    "        <div class=\"lHr _padding-5 _top _bottom\"></div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"row\" ng-if=\"vm.region.value || vm.region.value === 0\">\n" +
    "        <div class=\"col-xs-3\">\n" +
    "            <h5>\n" +
    "                <span class=\"public-statistic-value\">\n" +
    "                    {{vm.region.value}} р.\n" +
    "                </span>\n" +
    "            </h5>\n" +
    "        </div>\n" +
    "        <div class=\"col-xs-9\">\n" +
    "            <h5>Средний размер начислений за коммунальную услугу \"{{vm.munCharge.municipalServiceName}}\"</h5>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <h5 ng-if=\"vm.region.documentCount\">\n" +
    "        <div class=\"lHr _padding-5 _bottom\"></div>\n" +
    "        <span class=\"public-statistic-value\">{{vm.region.documentCount}} </span>\n" +
    "        платежных документов, содержащих начисления по услуге \"{{vm.munCharge.municipalServiceName}}\", участвовали в расчете\n" +
    "    </h5>\n" +
    "\n" +
    "    <h4 ng-if=\"!vm.region.value && !vm.region.documentCount\" class=\"text-center\">Нет данных</h4>\n" +
    "\n" +
    "    <span class=\"arrow tipCorner\"></span>\n" +
    "</div>\n" +
    "\n" +
    "<div ng-if=\"vm.oktmoChargesAvailable()\">\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-12\">\n" +
    "            <h4>\n" +
    "                Средний размер начислений за коммунальную услугу \"{{vm.oktmoCharges.municipalServiceName}}\"\n" +
    "                по муниципальным образованиям субъекта \"{{vm.oktmoCharges.regionName}}\"\n" +
    "            </h4>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-12\">\n" +
    "            <table class=\"table-base table-bordered\">\n" +
    "                <thead>\n" +
    "                <tr>\n" +
    "                    <th class=\"cell-center\">Код ОКТМО</th>\n" +
    "                    <th class=\"cell-center\">Наименование муниципального образования</th>\n" +
    "                    <th class=\"cell-center\">Средний размер начислений</th>\n" +
    "                </tr>\n" +
    "                </thead>\n" +
    "                <tbody>\n" +
    "                <tr ng-repeat=\"territoryData in vm.oktmoCharges.territoryData\">\n" +
    "                    <td>{{territoryData.territoryCode}}</td>\n" +
    "\n" +
    "                    <td>{{territoryData.territoryName}}</td>\n" +
    "\n" +
    "                    <td>{{territoryData.value}}</td>\n" +
    "                </tr>\n" +
    "                </tbody>\n" +
    "            </table>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("wdgt-municipal-services-debt/wdgt-municipal-services-debt.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("wdgt-municipal-services-debt/wdgt-municipal-services-debt.tpl.html",
    "<intan-widget-header page-title=\"vm.pageTitle\" breadcrumbs=\"vm.breadcrumbs\"\n" +
    "    info-date=\"vm.date\"></intan-widget-header>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <h5>\n" +
    "            <span class=\"public-statistic-value\">{{vm.munDebt.average}} р. </span>\n" +
    "            Средний размер задолженности по оплате ЖКУ по России*\n" +
    "        </h5>\n" +
    "\n" +
    "        <h4 class=\"_padding-20 _top\">Средний размер задолженности по оплате ЖКУ</h4>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-3\">\n" +
    "        <ul class=\"public-statistic-legend\">\n" +
    "            <li ng-repeat=\"range in vm.ranges\">\n" +
    "                <span class=\"legend-ico\" ng-class=\"range.style\"></span>\n" +
    "                <span class=\"legend-txt\">{{range.begin}} - {{range.end}} р.</span>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <span class=\"legend-ico wlico1\"></span>\n" +
    "                <span class=\"legend-txt0\">Нет данных</span>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-9\">\n" +
    "        <intan-map\n" +
    "            regions=\"vm.regions\"\n" +
    "            on-mouse-over=\"vm.setRegion\"\n" +
    "            on-click=\"vm.getOktmoDebts\"\n" +
    "            tooltip-id=\"public-statistic-region-map-tip\">\n" +
    "        </intan-map>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <span class=\"intan-annotation _padding-5 _bottom\">*Прим. {{vm.note}}</span>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<ef-bp-form no-search-btn=\"true\">\n" +
    "    <div class=\"form-base\"><div class=\"form-base__body\">\n" +
    "        <ng-form class=\"form-horizontal\" role=\"form\">\n" +
    "            <div class=\"row form-base__row\">\n" +
    "                <div class=\"col-xs-12 form-base_pad_light\">\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <label class=\"col-xs-2\">Отображать на карте:</label>\n" +
    "\n" +
    "                        <label class=\"col-xs-2 control-label form-base__control-label\">\n" +
    "                            За расчетный период</label>\n" +
    "\n" +
    "                        <div class=\"col-xs-2\">\n" +
    "                            <select ui-select2\n" +
    "                                    class=\"form-control form-base__form-control\"\n" +
    "                                    ng-model=\"vm.searchParams.monthYear\"\n" +
    "                                    data-placeholder=\"Выберите значение\"\n" +
    "                                    ng-change=\"vm.search()\">\n" +
    "\n" +
    "                                <option value=\"\"></option>\n" +
    "                                <option ng-repeat=\"monthYear in vm.monthYears\"\n" +
    "                                        value=\"{{monthYear}}\">\n" +
    "                                    {{monthYear}}\n" +
    "                                </option>\n" +
    "                            </select>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </ng-form>\n" +
    "    </div></div>\n" +
    "</ef-bp-form>\n" +
    "\n" +
    "<div id=\"public-statistic-region-map-tip\"\n" +
    "     class=\"public-statistic-region-map-tip popover top form-base form-base__body _padding-0 _top roboto\">\n" +
    "    <div>\n" +
    "        <a href=\"\" class=\"cnt-link text-center\">\n" +
    "            <h4 class=\"tip-popover-title roboto\">{{vm.region.name}}</h4>\n" +
    "        </a>\n" +
    "        <div class=\"lHr _padding-5 _top _bottom\"></div>\n" +
    "    </div>\n" +
    "\n" +
    "    <h5 ng-if=\"vm.regionValueAvailable()\">\n" +
    "        <span class=\"public-statistic-value\">{{vm.region.value}} р. </span>\n" +
    "        Средний размер задолженности по оплате ЖКУ*\n" +
    "    </h5>\n" +
    "\n" +
    "    <h5 ng-if=\"vm.region.documentCount\">\n" +
    "        <div class=\"lHr _padding-5 _bottom\"></div>\n" +
    "        <span class=\"public-statistic-value\">{{vm.region.documentCount}} </span>\n" +
    "        платежных документов участвовали в расчете\n" +
    "    </h5>\n" +
    "\n" +
    "    <div ng-if=\"vm.regionValueAvailable()\" class=\"intan-annotation _padding-5 _bottom\">\n" +
    "        <div class=\"lHr _padding-5 _bottom\"></div>\n" +
    "        *Прим. {{vm.note}}\n" +
    "    </div>\n" +
    "\n" +
    "    <h4 ng-if=\"!vm.regionValueAvailable() && !vm.region.documentCount\" class=\"text-center\">Нет данных</h4>\n" +
    "\n" +
    "    <span class=\"arrow tipCorner\"></span>\n" +
    "</div>\n" +
    "\n" +
    "<div ng-if=\"vm.oktmoDebtsAvailable()\">\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-12\">\n" +
    "            <h4>\n" +
    "                Средний размер задолженности по оплате ЖКУ\n" +
    "                по муниципальным образованиям субъекта \"{{vm.oktmoDebts.regionName}}\"\n" +
    "            </h4>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-12\">\n" +
    "            <table class=\"table-base table-bordered\">\n" +
    "                <thead>\n" +
    "                <tr>\n" +
    "                    <th class=\"cell-center\">Код ОКТМО</th>\n" +
    "                    <th class=\"cell-center\">Наименование муниципального образования</th>\n" +
    "                    <th class=\"cell-center\">Средний размер задолженности</th>\n" +
    "                </tr>\n" +
    "                </thead>\n" +
    "                <tbody>\n" +
    "                <tr ng-repeat=\"territoryData in vm.oktmoDebts.territoryData\">\n" +
    "                    <td>{{territoryData.territoryCode}}</td>\n" +
    "\n" +
    "                    <td>{{territoryData.territoryName}}</td>\n" +
    "\n" +
    "                    <td>{{territoryData.value}}</td>\n" +
    "                </tr>\n" +
    "                </tbody>\n" +
    "            </table>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("wdgt-municipal-services-normative/wdgt-municipal-services-normative.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("wdgt-municipal-services-normative/wdgt-municipal-services-normative.tpl.html",
    "<intan-widget-header page-title=\"vm.pageTitle\" breadcrumbs=\"vm.breadcrumbs\"\n" +
    "    info-date=\"vm.date\"></intan-widget-header>\n" +
    "\n" +
    "<div class=\"row\" ng-if=\"vm.regions\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <h5>\n" +
    "            <span class=\"public-statistic-value\">\n" +
    "                {{vm.munService.average | number:2}} {{vm.munService.measuringUnits}} </span>\n" +
    "            Средний норматив потребления коммунального ресурса \"{{vm.munService.municipalResourceName}}\"\n" +
    "            при оказании услуги \"{{vm.munService.municipalServiceName}}\" по России\n" +
    "        </h5>\n" +
    "\n" +
    "        <h4 class=\"_padding-20 _top\">\n" +
    "            Средний норматив потребления коммунального ресурса \"{{vm.munService.municipalResourceName}}\"\n" +
    "            при оказании услуги \"{{vm.munService.municipalServiceName}}\"\n" +
    "        </h4>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-3\">\n" +
    "        <ul class=\"public-statistic-legend\">\n" +
    "            <ul class=\"public-statistic-legend\">\n" +
    "                <li ng-repeat=\"range in vm.ranges\">\n" +
    "                    <span class=\"legend-ico\" ng-class=\"range.style\"></span>\n" +
    "                    <span class=\"legend-txt\">{{range.name}}</span>\n" +
    "                </li>\n" +
    "            </ul>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-9\">\n" +
    "        <intan-map\n" +
    "            regions=\"vm.regions\"\n" +
    "            on-mouse-over=\"vm.setRegion\"\n" +
    "            tooltip-id=\"public-statistic-region-map-tip\">\n" +
    "        </intan-map>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<br/>\n" +
    "\n" +
    "<ef-bp-form no-search-btn=\"true\">\n" +
    "    <div class=\"form-base\"><div class=\"form-base__body\">\n" +
    "        <ng-form class=\"form-horizontal\" role=\"form\">\n" +
    "            <div class=\"row form-base__row\">\n" +
    "                <div class=\"col-xs-12 form-base_pad_light\">\n" +
    "                    <div class=\"row\">\n" +
    "                        <label class=\"col-xs-2\">Отображать на карте:</label>\n" +
    "\n" +
    "                        <div class=\"col-xs-10\">\n" +
    "                            <div class=\"form-group\">\n" +
    "                                <label class=\"col-xs-2 control-label form-base__control-label\">\n" +
    "                                    Данные за квартал</label>\n" +
    "\n" +
    "                                <div class=\"col-xs-4\">\n" +
    "                                    <select ui-select2\n" +
    "                                            class=\"form-control form-base__form-control\"\n" +
    "                                            ng-model=\"vm.searchParams.quarterYear\"\n" +
    "                                            data-placeholder=\"Выберите значение\"\n" +
    "                                            ng-change=\"vm.quarterYearChange()\">\n" +
    "\n" +
    "                                        <option value=\"\"></option>\n" +
    "                                        <option ng-repeat=\"quarterYear in vm.quarterYears\"\n" +
    "                                                value=\"{{quarterYear}}\">\n" +
    "                                            {{quarterYear}}\n" +
    "                                        </option>\n" +
    "                                    </select>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "\n" +
    "\n" +
    "                            <div class=\"form-group\">\n" +
    "                                <label class=\"col-xs-2 control-label form-base__control-label\">\n" +
    "                                    По коммунальной услуге</label>\n" +
    "\n" +
    "                                <div class=\"col-xs-4\">\n" +
    "                                    <select ui-select2\n" +
    "                                            class=\"form-control form-base__form-control\"\n" +
    "                                            ng-model=\"vm.searchParams.munService\"\n" +
    "                                            data-placeholder=\"Выберите значение\"\n" +
    "                                            ng-disabled=\"!vm.munServiceSelectAvailable()\"\n" +
    "                                            ng-change=\"vm.munServiceChange()\">\n" +
    "\n" +
    "                                        <option value=\"\"></option>\n" +
    "                                        <option ng-repeat=\"munService in vm.munServiceCodes\"\n" +
    "                                                value=\"{{munService}}\">\n" +
    "                                            {{vm.munServiceNames[munService]}}\n" +
    "                                        </option>\n" +
    "                                    </select>\n" +
    "                                </div>\n" +
    "\n" +
    "                                <label class=\"col-xs-2 control-label form-base__control-label\">\n" +
    "                                    По коммунальному ресурсу</label>\n" +
    "\n" +
    "                                <div class=\"col-xs-4\">\n" +
    "                                    <select ui-select2\n" +
    "                                            class=\"form-control form-base__form-control\"\n" +
    "                                            ng-model=\"vm.searchParams.munResource\"\n" +
    "                                            data-placeholder=\"Выберите значение\"\n" +
    "                                            ng-disabled=\"!vm.munResourceSelectAvailable()\"\n" +
    "                                            ng-change=\"vm.vm.munResourceChange()\">\n" +
    "\n" +
    "                                        <option value=\"\"></option>\n" +
    "                                        <option ng-repeat=\"munResource in vm.munResourceCodes\"\n" +
    "                                                value=\"{{munResource}}\">\n" +
    "                                            {{vm.munResourceNames[munResource]}}\n" +
    "                                        </option>\n" +
    "                                    </select>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "\n" +
    "                            <div class=\"form-group\">\n" +
    "                                <label class=\"col-xs-2 control-label form-base__control-label\">\n" +
    "                                    По направлению использования</label>\n" +
    "\n" +
    "                                <div class=\"col-xs-4\">\n" +
    "                                    <select ui-select2\n" +
    "                                            class=\"form-control form-base__form-control\"\n" +
    "                                            ng-model=\"vm.searchParams.munDirection\"\n" +
    "                                            data-placeholder=\"Выберите значение\"\n" +
    "                                            ng-disabled=\"!vm.munDirectionSelectAvailable()\"\n" +
    "                                            ng-change=\"vm.munDirectionChange()\">\n" +
    "\n" +
    "                                        <option value=\"\"></option>\n" +
    "                                        <option ng-repeat=\"munDirection in vm.munDirections\"\n" +
    "                                                value=\"{{munDirection}}\">\n" +
    "                                            {{munDirection}}\n" +
    "                                        </option>\n" +
    "                                    </select>\n" +
    "                                </div>\n" +
    "\n" +
    "                                <label class=\"col-xs-2 control-label form-base__control-label\">\n" +
    "                                    По единице измерения</label>\n" +
    "\n" +
    "                                <div class=\"col-xs-4\">\n" +
    "                                    <select ui-select2\n" +
    "                                            class=\"form-control form-base__form-control\"\n" +
    "                                            ng-model=\"vm.searchParams.munUnit\"\n" +
    "                                            data-placeholder=\"Выберите значение\"\n" +
    "                                            ng-disabled=\"!vm.munUnitSelectAvailable()\"\n" +
    "                                            ng-change=\"vm.munUnitChange()\">\n" +
    "\n" +
    "                                        <option value=\"\"></option>\n" +
    "                                        <option ng-repeat=\"munUnit in vm.munUnits\"\n" +
    "                                                value=\"{{munUnit}}\">\n" +
    "                                            {{munUnit}}\n" +
    "                                        </option>\n" +
    "                                    </select>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </ng-form>\n" +
    "    </div></div>\n" +
    "</ef-bp-form>\n" +
    "\n" +
    "<div id=\"public-statistic-region-map-tip\"\n" +
    "     class=\"public-statistic-region-map-tip popover top form-base form-base__body _padding-0 _top roboto\">\n" +
    "    <div>\n" +
    "        <a href=\"\" class=\"cnt-link text-center\">\n" +
    "            <h4 class=\"tip-popover-title roboto\">{{vm.region.name}}</h4>\n" +
    "        </a>\n" +
    "        <div class=\"lHr _padding-5 _top _bottom\"></div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"vm.region.value\" class=\"row\" >\n" +
    "        <div class=\"col-xs-3\">\n" +
    "            <h5>\n" +
    "                <span class=\"public-statistic-long-value\">\n" +
    "                    {{vm.region.value | number:2}} {{vm.munService.measuringUnits}}\n" +
    "                </span>\n" +
    "            </h5>\n" +
    "        </div>\n" +
    "        <div class=\"col-xs-9\">\n" +
    "            <h5>\n" +
    "                Средний норматив потребления коммунального ресурса \"{{vm.munService.municipalResourceName}}\"\n" +
    "                при оказании услуги \"{{vm.munService.municipalServiceName}}\"\n" +
    "            </h5>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <h4 ng-if=\"!vm.region.value\" class=\"text-center\">Нет данных</h4>\n" +
    "\n" +
    "    <span class=\"arrow tipCorner\"></span>\n" +
    "</div>\n" +
    "");
}]);

angular.module("wdgt-municipal-services-payment/wdgt-municipal-services-payment.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("wdgt-municipal-services-payment/wdgt-municipal-services-payment.tpl.html",
    "<intan-widget-header page-title=\"vm.pageTitle\" breadcrumbs=\"vm.breadcrumbs\"\n" +
    "    info-date=\"vm.date\"></intan-widget-header>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <h5>\n" +
    "            <span class=\"public-statistic-value\">{{vm.munPayment.average}} р. </span>\n" +
    "            Средняя сумма платы за ЖКУ по России\n" +
    "        </h5>\n" +
    "\n" +
    "        <h5>\n" +
    "            <span class=\"public-statistic-value\">{{vm.munPayment.paymentPercent}}% </span>\n" +
    "            Доля размера платы от средней заработной платы*\n" +
    "        </h5>\n" +
    "\n" +
    "        <h4 class=\"_padding-20 _top\">Средняя сумма платы за ЖКУ</h4>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-3\">\n" +
    "        <ul class=\"public-statistic-legend\">\n" +
    "            <li ng-repeat=\"range in vm.ranges\">\n" +
    "                <span class=\"legend-ico\" ng-class=\"range.style\"></span>\n" +
    "                <span class=\"legend-txt\">{{range.begin}} - {{range.end}} р.</span>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <span class=\"legend-ico wlico1\"></span>\n" +
    "                <span class=\"legend-txt0\">Нет данных</span>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-9\">\n" +
    "        <intan-map\n" +
    "            regions=\"vm.regions\"\n" +
    "            on-mouse-over=\"vm.setRegion\"\n" +
    "            on-click=\"vm.getOktmoPayments\"\n" +
    "            tooltip-id=\"public-statistic-region-map-tip\">\n" +
    "        </intan-map>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <span class=\"intan-annotation _padding-5 _bottom\">*Прим. {{vm.note}}</span>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<ef-bp-form no-search-btn=\"true\">\n" +
    "    <div class=\"form-base\"><div class=\"form-base__body\">\n" +
    "        <ng-form class=\"form-horizontal\" role=\"form\">\n" +
    "            <div class=\"row form-base__row\">\n" +
    "                <div class=\"col-xs-12 form-base_pad_light\">\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <label class=\"col-xs-2\">Отображать на карте:</label>\n" +
    "\n" +
    "                        <label class=\"col-xs-2 control-label form-base__control-label\">\n" +
    "                            За расчетный период</label>\n" +
    "\n" +
    "                        <div class=\"col-xs-2\">\n" +
    "                            <select ui-select2\n" +
    "                                    class=\"form-control form-base__form-control\"\n" +
    "                                    ng-model=\"vm.searchParams.monthYear\"\n" +
    "                                    data-placeholder=\"Выберите значение\"\n" +
    "                                    ng-change=\"vm.search()\">\n" +
    "\n" +
    "                                <option value=\"\"></option>\n" +
    "                                <option ng-repeat=\"monthYear in vm.monthYears\"\n" +
    "                                        value=\"{{monthYear}}\">\n" +
    "                                    {{monthYear}}\n" +
    "                                </option>\n" +
    "                            </select>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </ng-form>\n" +
    "    </div></div>\n" +
    "</ef-bp-form>\n" +
    "\n" +
    "<div id=\"public-statistic-region-map-tip\"\n" +
    "     class=\"public-statistic-region-map-tip popover top form-base form-base__body _padding-0 _top roboto\">\n" +
    "    <div>\n" +
    "        <a href=\"\" class=\"cnt-link text-center\">\n" +
    "            <h4 class=\"tip-popover-title roboto\">{{vm.region.name}}</h4>\n" +
    "        </a>\n" +
    "        <div class=\"lHr _padding-5 _top _bottom\"></div>\n" +
    "    </div>\n" +
    "\n" +
    "    <h5 ng-if=\"vm.regionValueAvailable()\">\n" +
    "        <span class=\"public-statistic-value\">{{vm.region.value}} р. </span>\n" +
    "        Средняя сумма платы за ЖКУ\n" +
    "    </h5>\n" +
    "\n" +
    "    <h5 ng-if=\"vm.paymentPercentAvailable()\">\n" +
    "        <span class=\"public-statistic-value\">{{vm.region.paymentPercent}}% </span>\n" +
    "        Доля размера платы от средней заработной платы по субъекту*\n" +
    "    </h5>\n" +
    "\n" +
    "    <h5 ng-if=\"vm.region.documentCount\">\n" +
    "        <div class=\"lHr _padding-5 _bottom\"></div>\n" +
    "        <span class=\"public-statistic-value\">{{vm.region.documentCount}} </span>\n" +
    "        платежных документов участвовали в расчете\n" +
    "    </h5>\n" +
    "\n" +
    "    <div ng-if=\"vm.paymentPercentAvailable()\" class=\"intan-annotation _padding-5 _bottom\">\n" +
    "        <div class=\"lHr _padding-5 _bottom\"></div>\n" +
    "        *Прим. {{vm.note}}\n" +
    "    </div>\n" +
    "\n" +
    "    <h4 ng-if=\"!vm.regionValueAvailable() && !paymentPercentAvailable() && !vm.region.documentCount\"\n" +
    "        class=\"text-center\">Нет данных</h4>\n" +
    "\n" +
    "    <span class=\"arrow tipCorner\"></span>\n" +
    "</div>\n" +
    "\n" +
    "<div ng-if=\"vm.oktmoPaymentsAvailable()\">\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-12\">\n" +
    "            <h4>\n" +
    "                Средняя сумма платы за ЖКУ\n" +
    "                по муниципальным образованиям субъекта \"{{vm.oktmoPayments.regionName}}\"\n" +
    "            </h4>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-12\">\n" +
    "            <table class=\"table-base table-bordered\">\n" +
    "                <thead>\n" +
    "                <tr>\n" +
    "                    <th class=\"cell-center\">Код ОКТМО</th>\n" +
    "                    <th class=\"cell-center\">Наименование муниципального образования</th>\n" +
    "                    <th class=\"cell-center\">Средняя сумма платы за ЖКУ</th>\n" +
    "                </tr>\n" +
    "                </thead>\n" +
    "                <tbody>\n" +
    "                <tr ng-repeat=\"territoryData in vm.oktmoPayments.territoryData\">\n" +
    "                    <td>{{territoryData.territoryCode}}</td>\n" +
    "\n" +
    "                    <td>{{territoryData.territoryName}}</td>\n" +
    "\n" +
    "                    <td>{{territoryData.value}}</td>\n" +
    "                </tr>\n" +
    "                </tbody>\n" +
    "            </table>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("wdgt-municipal-services-tariff/wdgt-municipal-services-tariff.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("wdgt-municipal-services-tariff/wdgt-municipal-services-tariff.tpl.html",
    "<intan-widget-header page-title=\"vm.pageTitle\" breadcrumbs=\"vm.breadcrumbs\"\n" +
    "    info-date=\"vm.date\"></intan-widget-header>\n" +
    "\n" +
    "<div class=\"row\" ng-if=\"vm.regions\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <h5>\n" +
    "            <span class=\"public-statistic-value\"> {{vm.munResource.average}} р./{{vm.munResource.units}}</span>\n" +
    "            Средний тариф на коммунальный ресурс \"{{vm.munResource.munResourceName}}\" по России\n" +
    "        </h5>\n" +
    "\n" +
    "        <h4 class=\"_padding-20 _top\">Средний тариф на коммунальный ресурс \"{{vm.munResource.munResourceName}}\"</h4>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "    <div class=\"col-xs-3\">\n" +
    "        <ul class=\"public-statistic-legend\">\n" +
    "            <li ng-repeat=\"range in vm.ranges\">\n" +
    "                <span class=\"legend-ico\" ng-class=\"range.style\"></span>\n" +
    "                <span class=\"legend-txt\">{{range.begin}} - {{range.end}} р./{{vm.munResource.units}}</span>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <span class=\"legend-ico wlico1\"></span>\n" +
    "                <span class=\"legend-txt0\">Нет данных</span>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-9\">\n" +
    "        <intan-map\n" +
    "            regions=\"vm.regions\"\n" +
    "            on-mouse-over=\"vm.setRegion\"\n" +
    "            tooltip-id=\"public-statistic-region-map-tip\">\n" +
    "        </intan-map>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<br/>\n" +
    "\n" +
    "<ef-bp-form no-search-btn=\"true\">\n" +
    "    <div class=\"form-base\"><div class=\"form-base__body\">\n" +
    "        <ng-form class=\"form-horizontal\" role=\"form\">\n" +
    "            <div class=\"row form-base__row\">\n" +
    "                <div class=\"col-xs-12 form-base_pad_light\">\n" +
    "                    <div class=\"form-group form-base__form-group\">\n" +
    "                        <label class=\"col-xs-2\">Отображать на карте:</label>\n" +
    "\n" +
    "                        <label class=\"col-xs-2 control-label form-base__control-label\">\n" +
    "                            По коммунальному ресурсу</label>\n" +
    "\n" +
    "                        <div class=\"col-xs-3\">\n" +
    "                            <select ui-select2\n" +
    "                                    class=\"form-control form-base__form-control\"\n" +
    "                                    ng-model=\"vm.searchParams.munResource\"\n" +
    "                                    data-placeholder=\"Выберите значение\"\n" +
    "                                    ng-change=\"vm.search()\">\n" +
    "\n" +
    "                                <option value=\"\"></option>\n" +
    "                                <option ng-repeat=\"munResource in vm.munResourceKeys\"\n" +
    "                                        value=\"{{munResource}}\">\n" +
    "                                    {{vm.munResourceNames[munResource]}}\n" +
    "                                </option>\n" +
    "                            </select>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </ng-form>\n" +
    "    </div></div>\n" +
    "</ef-bp-form>\n" +
    "\n" +
    "<div id=\"public-statistic-region-map-tip\"\n" +
    "     class=\"public-statistic-region-map-tip popover top form-base form-base__body _padding-0 _top roboto\">\n" +
    "    <div>\n" +
    "        <a href=\"\" class=\"cnt-link text-center\">\n" +
    "            <h4 class=\"tip-popover-title roboto\">{{vm.region.name}}</h4>\n" +
    "        </a>\n" +
    "        <div class=\"lHr _padding-5 _top _bottom\"></div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"vm.region.value\">\n" +
    "        <h5>\n" +
    "            <span class=\"public-statistic-value\">{{vm.region.value}} р./{{vm.munResource.units}} </span>\n" +
    "            Средний тариф на коммунальный ресурс \"{{vm.munResource.munResourceName}}\"\n" +
    "        </h5>\n" +
    "        <h5 class=\"_padding-20 _top\">\n" +
    "            Средний тариф по России составляет\n" +
    "            <span class=\"public-statistic-value\"> {{vm.munResource.average}} р./{{vm.munResource.units}}</span>\n" +
    "        </h5>\n" +
    "    </div>\n" +
    "\n" +
    "    <h4 ng-if=\"!vm.region.value\" class=\"text-center\">Нет данных</h4>\n" +
    "\n" +
    "    <span class=\"arrow tipCorner\"></span>\n" +
    "</div>\n" +
    "");
}]);

angular.module("work-cost-analysis/work-cost-analysis.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("work-cost-analysis/work-cost-analysis.tpl.html",
    "<intan-widget-header page-title=\"vm.pageTitle\" breadcrumbs=\"vm.breadcrumbs\"\n" +
    "    info-date=\"vm.date\"></intan-widget-header>\n" +
    "\n" +
    "<div class=\"form-base form-base_no-border bg-color_gray-light _margin-20 _top\">\n" +
    "    <div class=\"form-base__body\">\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-xs-9\">\n" +
    "                <div class=\"form-group form-base__form-group\">\n" +
    "                    <label class=\"col-xs-2 control-label form-base__control-label\">\n" +
    "                        Субъект РФ</label>\n" +
    "\n" +
    "                    <div class=\"col-xs-10\">\n" +
    "                        <multiselect2\n" +
    "                            class=\"form-control form-base__form-control\"\n" +
    "                            ng-model=\"vm.selectedRegions\"\n" +
    "                            options=\"vm.regionSelectOptions\"\n" +
    "                            on-change=\"vm.selectRegions\"\n" +
    "                            required=\"true\">\n" +
    "                        </multiselect2>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"col-xs-3\">\n" +
    "                <div class=\"form-group form-base__form-group\">\n" +
    "                    <label class=\"col-xs-3 control-label form-base__control-label\">\n" +
    "                        Период</label>\n" +
    "\n" +
    "                    <div class=\"col-xs-9\">\n" +
    "                        <select ui-select2\n" +
    "                                class=\"form-control form-base__form-control\"\n" +
    "                                ng-model=\"vm.selectedMonthYear\"\n" +
    "                                data-placeholder=\"Выберите значение\"\n" +
    "                                ng-change=\"vm.selectPeriod()\">\n" +
    "\n" +
    "                            <option value=\"\"></option>\n" +
    "                            <option ng-repeat=\"monthYear in vm.monthYears\"\n" +
    "                                    value=\"{{monthYear}}\">\n" +
    "                                {{monthYear}}\n" +
    "                            </option>\n" +
    "                        </select>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <hr />\n" +
    "\n" +
    "        <div class=\"row _margin-20 _top\" ng-if=\"!vm.data\">\n" +
    "            <div class=\"col-xs-12 text-center\">\n" +
    "                <span class=\"h3\">Нет данных</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row _margin-20 _top\" ng-if=\"vm.data\">\n" +
    "            <div class=\"col-xs-7\">\n" +
    "                <span class=\"app-icon app-icon_cl_prime app-icon_xl whhg-value-coins\"></span>\n" +
    "                <div class=\"h1 app-icon_cl_prime _as-inline-block bold _padding-20 _left _right\">\n" +
    "                    {{vm.data.stat.totalStat.workCost | number:0}} руб.</div>\n" +
    "                <div class=\"h5 _as-inline-block _padding-12 _top\">\n" +
    "                    Общая стоимость работ <br />за {{vm.selectedMonthYear}}</div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"col-xs-5\">\n" +
    "                <span class=\"app-icon app-icon_cl_prime app-icon_xl whhg-city\"></span>\n" +
    "                <div class=\"h1 app-icon_cl_prime _as-inline-block bold _padding-20 _left _right\">\n" +
    "                    {{vm.data.stat.totalStat.mkdCount | number:0}}</div>\n" +
    "                <div class=\"h5 _as-inline-block _padding-12 _top\">\n" +
    "                    Всего МКД, в которых <br />были выполнены работы</div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <hr ng-if=\"vm.data\" />\n" +
    "\n" +
    "        <div class=\"row _margin-20 _top\" ng-if=\"vm.data\">\n" +
    "            <div class=\"col-xs-12\">\n" +
    "                <span class=\"h3 bold\">{{vm.chartTitle}}</span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row _margin-20 _top\" ng-if=\"vm.data\">\n" +
    "            <div class=\"col-xs-5 text-center\">\n" +
    "                <div class=\"intan-work-cost-analysis-chart\">\n" +
    "                    <intan-bagel-chart\n" +
    "                        radius=\"180\"\n" +
    "                        data=\"vm.chartData\"\n" +
    "                        sizes=\"[[19,16,14],[18,21]]\"\n" +
    "                        on-mouse-over=\"vm.specifySector(data)\"\n" +
    "                        on-mouse-out=\"vm.resetSpecifiedSector()\"\n" +
    "                        tooltip-id=\"intan-bagel-chart-tooltip-work-cost\">\n" +
    "                    </intan-bagel-chart>\n" +
    "\n" +
    "                    <div class=\"chart-center\" ng-style=\"{'color': vm.specifiedSector.color}\">\n" +
    "                        {{vm.specifiedSector.stats.relativeWorkCost | intanPercent:0:'%':''}}\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "\n" +
    "                <div id=\"intan-bagel-chart-tooltip-work-cost\"\n" +
    "                    class=\"popover top intan-tooltip intan-work-cost-analysis-chart-tooltip\">\n" +
    "\n" +
    "                    <div class=\"row _margin-10 _bottom\" ng-if=\"!vm.isSingle()\">\n" +
    "                        <div class=\"col-xs-12 text-center\">\n" +
    "                            <span class=\"h4\">{{vm.specifiedSector.name | uppercase}}</span>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "\n" +
    "                    <div class=\"row\">\n" +
    "                        <div class=\"col-xs-5 text-right\">\n" +
    "                            <span class=\"value\" ng-style=\"{'background-color': vm.specifiedSector.color}\">\n" +
    "                                {{vm.specifiedSector.stats.workCost | number:0}} руб.\n" +
    "                            </span>\n" +
    "                        </div>\n" +
    "                        <div class=\"col-xs-7\">\n" +
    "                            <div class=\"description\">{{vm.specifiedSector.workCostStatName}}</div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "\n" +
    "                    <div class=\"row\">\n" +
    "                        <div class=\"col-xs-5 text-right\">\n" +
    "                            <span class=\"value\" ng-style=\"{'background-color': vm.specifiedSector.color}\">\n" +
    "                                {{vm.specifiedSector.stats.averageWorkCost | number:0}} руб.\n" +
    "                            </span>\n" +
    "                        </div>\n" +
    "                        <div class=\"col-xs-7\">\n" +
    "                            <div class=\"description\">{{vm.specifiedSector.averageWorkCostStatName}}</div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "\n" +
    "                    <div class=\"row\">\n" +
    "                        <div class=\"col-xs-5 text-right\">\n" +
    "                            <span class=\"value\" ng-style=\"{'background-color': vm.specifiedSector.color}\">\n" +
    "                                {{vm.specifiedSector.stats.mkdCount | number:0}}\n" +
    "                            </span>\n" +
    "                        </div>\n" +
    "                        <div class=\"col-xs-7\">\n" +
    "                            <div class=\"description\">МКД, в которых были выполнены работы</div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"col-xs-7\" ng-if=\"vm.isSingle()\">\n" +
    "                <div class=\"row _margin-50 _top\">\n" +
    "                    <div class=\"col-xs-12\">\n" +
    "                        <span class=\"h4\">{{vm.legendTitle}}</span>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"row _margin-20 _top\">\n" +
    "                    <div class=\"col-xs-4\" ng-repeat=\"workType in vm.workTypes\">\n" +
    "                        <div class=\"intan-disk-50\"\n" +
    "                            ng-style=\"{'background-color': workType.color}\"></div>\n" +
    "\n" +
    "                        <div class=\"h5 _margin-10 _top\">{{workType.name}}\n" +
    "                            <intan-info-tooltip ng-if=\"workType === vm.EMERGENCY_WORK\"\n" +
    "                                tooltip-id=\"intan-emergency-work-tooltip\"></intan-info-tooltip>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"col-xs-7\" ng-if=\"!vm.isSingle()\">\n" +
    "                <div class=\"row _margin-50 _top\">\n" +
    "                    <div class=\"col-xs-7\">\n" +
    "                        <span class=\"h4\">СУБЪЕКТЫ РФ</span>\n" +
    "                        <div ng-repeat=\"item in vm.chartData.children\">\n" +
    "                            <div class=\"intan-disk-20 _as-inline-block _margin-8 _top\"\n" +
    "                                ng-style=\"{'background-color': item.color}\"></div>\n" +
    "\n" +
    "                            <div class=\"h5 _as-inline-block\">{{item.name}}</div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "\n" +
    "                    <div class=\"col-xs-5\">\n" +
    "                        <span class=\"h4\">ВИДЫ РАБОТ</span>\n" +
    "                        <div ng-repeat=\"workType in vm.workTypes\">\n" +
    "                            <div class=\"intan-disk-20 _as-inline-block _margin-8 _top\"\n" +
    "                                ng-style=\"{'background-color': workType.color}\"></div>\n" +
    "\n" +
    "                            <div class=\"h5 _as-inline-block\">{{workType.name}}\n" +
    "                                <intan-info-tooltip ng-if=\"workType === vm.EMERGENCY_WORK\"\n" +
    "                                    tooltip-id=\"intan-emergency-work-tooltip\"></intan-info-tooltip>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\" ng-if=\"vm.data\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <div class=\"_padding-20 _top\">\n" +
    "            <table class=\"table-base table-bordered table-entity\">\n" +
    "                <thead>\n" +
    "                    <tr>\n" +
    "                        <th class=\"text-center\" rowspan=\"2\">\n" +
    "                            №\n" +
    "                        </th>\n" +
    "                        <th rowspan=\"2\">\n" +
    "                            Субъект РФ\n" +
    "                        </th>\n" +
    "                        <th class=\"text-center\" colspan=\"3\">\n" +
    "                            Обслуживание\n" +
    "                        </th>\n" +
    "                        <th class=\"text-center\" colspan=\"3\">\n" +
    "                            Текущий ремонт\n" +
    "                        </th>\n" +
    "                        <th class=\"text-center\" colspan=\"3\">\n" +
    "                            Аварийные работы\n" +
    "                            <intan-info-tooltip tooltip-id=\"intan-emergency-work-tooltip\"></intan-info-tooltip>\n" +
    "                            <script type=\"text/ng-template\" id=\"intan-emergency-work-tooltip\">\n" +
    "                                <div class=\"hcs-popover-tooltip intan-popover-tooltip\">\n" +
    "                                    В аварийные работы (услуги) включается в том числе аварийно-диспетчерское обслуживание\n" +
    "                                </div>\n" +
    "                                <div class=\"triangle\"></div>\n" +
    "                            </script>\n" +
    "                        </th>\n" +
    "                    </tr>\n" +
    "\n" +
    "                    <tr>\n" +
    "                        <th class=\"text-center\">\n" +
    "                            Общая стоимость работ, руб.\n" +
    "                        </th>\n" +
    "                        <th class=\"text-center\">\n" +
    "                            Кол-во МКД, в которых были выполнены работы\n" +
    "                        </th>\n" +
    "                        <th class=\"text-center\">\n" +
    "                            Средняя стоимость работ по многоквартирному дому, руб.\n" +
    "                        </th>\n" +
    "\n" +
    "                        <th class=\"text-center\">\n" +
    "                            Общая стоимость работ, руб.\n" +
    "                        </th>\n" +
    "                        <th class=\"text-center\">\n" +
    "                            Кол-во МКД, в которых были выполнены работы\n" +
    "                        </th>\n" +
    "                        <th class=\"text-center\">\n" +
    "                            Средняя стоимость работ по многоквартирному дому, руб.\n" +
    "                        </th>\n" +
    "\n" +
    "                        <th class=\"text-center\">\n" +
    "                            Общая стоимость работ, руб.\n" +
    "                        </th>\n" +
    "                        <th class=\"text-center\">\n" +
    "                            Кол-во МКД, в которых были выполнены работы\n" +
    "                        </th>\n" +
    "                        <th class=\"text-center\">\n" +
    "                            Средняя стоимость работ по многоквартирному дому, руб.\n" +
    "                        </th>\n" +
    "                    </tr>\n" +
    "                </thead>\n" +
    "\n" +
    "                <tbody>\n" +
    "                    <tr class=\"bold\">\n" +
    "                        <td colspan=\"2\">\n" +
    "                            Итого по выбранным субъектам РФ\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap\">\n" +
    "                            {{vm.data.stat.workStats.MAINTENANCE_WORK.workCost | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap\">\n" +
    "                            {{vm.data.stat.workStats.MAINTENANCE_WORK.mkdCount | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap table-entity_cell_dark\">\n" +
    "                            {{vm.data.stat.workStats.MAINTENANCE_WORK.averageWorkCost | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap\">\n" +
    "                            {{vm.data.stat.workStats.REPAIR_WORK.workCost | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap\">\n" +
    "                            {{vm.data.stat.workStats.REPAIR_WORK.mkdCount | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap table-entity_cell_dark\">\n" +
    "                            {{vm.data.stat.workStats.REPAIR_WORK.averageWorkCost | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap\">\n" +
    "                            {{vm.data.stat.workStats.EMERGENCY_WORK.workCost | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap\">\n" +
    "                            {{vm.data.stat.workStats.EMERGENCY_WORK.mkdCount | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap table-entity_cell_dark\">\n" +
    "                            {{vm.data.stat.workStats.EMERGENCY_WORK.averageWorkCost | number:0}}\n" +
    "                        </td>\n" +
    "                    </tr>\n" +
    "                </tbody>\n" +
    "\n" +
    "                <tbody>\n" +
    "                    <tr ng-repeat=\"item in vm.data.items\">\n" +
    "                        <td class=\"text-center\">\n" +
    "                            {{$index + 1}}\n" +
    "                        </td>\n" +
    "                        <td class=\"table-entity_cell_dark\">\n" +
    "                            {{item.regionName}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap\">\n" +
    "                            {{item.stat.workStats.MAINTENANCE_WORK.workCost | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap\">\n" +
    "                            {{item.stat.workStats.MAINTENANCE_WORK.mkdCount | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap table-entity_cell_dark\">\n" +
    "                            {{item.stat.workStats.MAINTENANCE_WORK.averageWorkCost | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap\">\n" +
    "                            {{item.stat.workStats.REPAIR_WORK.workCost | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap\">\n" +
    "                            {{item.stat.workStats.REPAIR_WORK.mkdCount | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap table-entity_cell_dark\">\n" +
    "                            {{item.stat.workStats.REPAIR_WORK.averageWorkCost | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap\">\n" +
    "                            {{item.stat.workStats.EMERGENCY_WORK.workCost | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap\">\n" +
    "                            {{item.stat.workStats.EMERGENCY_WORK.mkdCount | number:0}}\n" +
    "                        </td>\n" +
    "                        <td class=\"text-right _nowrap table-entity_cell_dark\">\n" +
    "                            {{item.stat.workStats.EMERGENCY_WORK.averageWorkCost | number:0}}\n" +
    "                        </td>\n" +
    "                    </tr>\n" +
    "                </tbody>\n" +
    "            </table>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
