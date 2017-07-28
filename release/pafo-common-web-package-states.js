/**
 * pafo-common-web-package - v0.1.0
 * 2017-07-28 12:04:26 GMT+0500
 */
(function (angular) {'use strict';
    angular.module('templates-pafo-common', []);

    angular.module('pafo-common-web-package', [
        'templates-pafo-common',
        //'ngAnimate',
        'ui.router',
        //'ui.select2',
        //'ngCookies',
        'ngResource',
        'oc.lazyLoad',
        'rzModule',

        'templates-common',
        'templates-modules',
        'common',
        'common.hcs-pagination',
        'pafo-common-web-package.main-forms',
        'pafo-common-web-package'
    ])
    .factory('pafoCommonLazy', function () {
        return function () {return 'LAZY OFF';};
    });
})(angular);

(function (angular) {'use strict';
    pafoCommonLazyFactory.$inject = ["$ocLazyLoad"];
    angular.module('pafo-common-web-package')
        .factory('pafoCommonLazy', pafoCommonLazyFactory);

    /* @ngInject */
    function pafoCommonLazyFactory($ocLazyLoad) {
        return function () {
            return $ocLazyLoad.load({
                serie: true,
                rerun: true,
                files: [
                    'assets/js/d3.v3.min.js',
                    'assets/js/raphael.js', //TODO: remove after main-forms map replacing
                    'modules/vendor/pafo-common-web-package/release/pafo-common-web-package.js',
                    'modules/vendor/pafo-widgets-web-package/release/public-pafo-widgets-web-package.js', //TODO: check and remove this dependency
                    'assets/pafo-common-web-package.min.css'
                ]
            });
        };
    }
})(angular);

angular.module('pafo-common-web-package.main-forms', [
    'lodash',
    'common',
    'common.dialogs',
    'common.utils',
    'common.multiselect',
    'ru.lanit.hcs.nsi.rest.NsiPpaService',
    'common.service.$PublicStatisticService',
    'common.dialogs',
    'common.multiselecttree'
])
    .value("DEFAULT_PAGE_SIZE", 50)
    .value("CM_BACKEND_CONFIG", {
        baseUrl: '/content-management/api/rest/services'
    })
    .value('RKI_BACKEND_CONFIG', {
        baseUrl: '/rki/api/rest/services'
    })
    .value('NSI_BACKEND_CONFIG', {
        baseUrl: '/nsi/api/rest/services'
    })
    .constant('CM_FILE_STORE_CONFIG', {
        publicContext: 'contentmanagement'
    });

(function (angular) {'use strict';
    config.$inject = ["$stateProvider"];
    angular.module('pafo-common-web-package')
        .config(config);

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider.state('public-interactive-analytics-houses-condition-2', {
            url: '/houses-condition-2',
            views: {
                content: {
                    templateUrl: 'houses-condition-2/houses-condition-2.tpl.html',
                    controller: 'publicStatisticHousesCondition2Ctrl',
                    controllerAs: 'vm'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: "Анализ технического состояния многоквартирных домов",
                breadcrumbs: [
                    {
                        label: "Главная страница",
                        url: "#!"
                    },
                    {
                        label: "Анализ технического состояния многоквартирных домов"
                    }
                ]
            }
        });
    }
})(angular);

(function (angular) {'use strict';
    config.$inject = ["$stateProvider"];
    angular.module('pafo-common-web-package')
        .config(config);

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider.state('public-interactive-analytics-houses-condition', {
            url: '/houses-condition',
            views: {
                content: {
                    templateUrl: 'houses-condition/houses-condition.tpl.html',
                    controller: 'publicStatisticHousesConditionCtrl',
                    controllerAs:'vm'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: "Анализ технического состояния многоквартирных домов",
                breadcrumbs: [
                    {
                        label: "Главная страница",
                        url: "#!"
                    },
                    {
                        label: "Анализ технического состояния многоквартирных домов"
                    }
                ]
            }
        });
    }
})(angular);

(function (angular) {'use strict';
    config.$inject = ["$stateProvider"];
    angular.module('pafo-common-web-package.main-forms')
        .config(config);

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider.state('housing_stock', {
            url: '/housing_stock',
            views: {
                content: {
                    controller: 'HousingStockCtrl',
                    templateUrl: 'main-forms/ef-rosstat/ef-rosstat-housing-stock/ef-rosstat-housing-stock.tpl.html'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: 'Состояние жилого фонда',
                breadcrumbs: [
                    {
                        label: "Главная страница",
                        url: "#!"
                    },
                    {
                        label: "Состояние жилого фонда"
                    }
                ]
            }
        })
        .state('grants', {
            url: '/grants',
            views: {
                content: {
                    controller: 'GrantsCtrl',
                    templateUrl: 'main-forms/ef-rosstat/ef-rosstat-grants/ef-rosstat-grants.tpl.html'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: 'Субсидии и социальная поддержка по оплате жилого помещения и коммунальных услуг',
                breadcrumbs: [
                    {
                        label: "Главная страница",
                        url: "#!"
                    },
                    {
                        label: "Субсидии и льготы по оплате ЖКУ"
                    }
                ]
            }
        })
        .state('municipal_infrastructure', {
            url: '/municipal_infrastructure',
            views: {
                content: {
                    controller: 'MunicipalInfrastructureCtrl',
                    templateUrl: 'main-forms/ef-rosstat/ef-rosstat-municipal-infrastructure/ef-rosstat-municipal-infrastructure.tpl.html'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: 'Благоустройство и коммунальная инфраструктура',
                breadcrumbs: [
                    {
                        label: "Главная страница",
                        url: "#!"
                    },
                    {
                        label: "Благоустройство и коммунальная инфраструктура"
                    }
                ]
            }
        })
        .state('map', {
            url: '/map?isLimitProcent',
            views: {
                content: {
                    controller: 'MapWithStaticsCtrl',
                    templateUrl: 'main-forms/map/map.tpl.html'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: "Статистика внедрения ГИС ЖКХ по субъектам Российской Федерации",
                breadcrumbs: [
                    {
                        label: "Главная страница",
                        url: "#!"
                    },
                    {
                        label: "Карта внедрения ГИС ЖКХ"
                    }
                ]
            }
        })
        .state('statOfWaterQualityMap', {
            url: '/map/water-quality',
            views: {
                content: {
                    controller: 'MapWithStaticsOfWaterQualityCtrl',
                    templateUrl: 'main-forms/map/statOfWaterQualityMap.tpl.html'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: "Результаты федерального государственного санитарно-эпидемиологического надзора за качеством питьевой воды в субъектах Российской Федерации, в соответствии с формой федерального статистического наблюдения №18",
                breadcrumbs: [
                    {
                        label: "Главная страница",
                        url: "#!"
                    },
                    {
                        label: "Качество питьевой воды"
                    }
                ]
            }
        });
    }
})(angular);

(function (angular) {'use strict';
    config.$inject = ["$stateProvider"];
    angular.module('pafo-common-web-package')
        .config(config);

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider.state('public-interactive-analytics-mkd-odpu-2', {
            url: '/public-mkd-odpu-2',
            views: {
                content: {
                    templateUrl: 'public-mkd-odpu-2/public-mkd-odpu-2.tpl.html',
                    controller: 'publicStatisticPublicMkdOdpu2Ctrl',
                    controllerAs: 'vm'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: 'Оснащенность многоквартирных домов общедомовыми приборами учета',
                breadcrumbs: [
                    {
                        url: '#!',
                        label: 'Главная страница'
                    },
                    {
                        url: '',
                        label: 'Оснащенность многоквартирных домов общедомовыми приборами учета'
                    }
                ]
            }
        });
    }
})(angular);

(function (angular) {'use strict';
    config.$inject = ["$stateProvider"];
    angular.module('pafo-common-web-package')
        .config(config);

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider.state('public-interactive-analytics-mkd-odpu', {
            url: '/public-mkd-odpu',
            views: {
                content: {
                    templateUrl: 'public-mkd-odpu/public-mkd-odpu.tpl.html',
                    controller: 'publicStatisticPublicMkdOdpuCtrl',
                    controllerAs: 'vm'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: 'Оснащенность многоквартирных домов общедомовыми приборами учета',
                breadcrumbs: [
                    {
                        url: '#!',
                        label: 'Главная страница'
                    },
                    {
                        url: '',
                        label: 'Оснащенность многоквартирных домов общедомовыми приборами учета'
                    }
                ]
            }
        });
    }
})(angular);

(function (angular) {'use strict';
    config.$inject = ["$stateProvider"];
    angular.module('pafo-common-web-package')
        .config(config);

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider.state('public-interactive-analytics-service-providers-data', {
            url: '/service-providers-data',
            views: {
                content: {
                    templateUrl: 'service-providers-data/service-providers-data.tpl.html',
                    controller: 'ServiceProvidersDataCtrl',
                    controllerAs: 'vm'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: 'Сравнительный анализ по коммунальным услугам за расчетный период',
                breadcrumbs: [
                    {
                        url: '#!',
                        label: 'Главная страница'
                    },
                    {
                        url: '',
                        label: 'Сравнительный анализ по коммунальным услугам за расчетный период'
                    }
                ]
            }
        });
    }
})(angular);

(function (angular) {'use strict';
    config.$inject = ["$stateProvider"];
    angular.module('pafo-common-web-package')
        .config(config);

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider.state('public-statistic-wdgt-contribution-size-2', {
            url: '/wdgt-contribution-size-2',
            views: {
                content: {
                    templateUrl: 'wdgt-contribution-size-2/wdgt-contribution-size-2.tpl.html',
                    controller: 'publicStatisticWdgtContributionSize2Ctrl',
                    controllerAs: 'vm'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: 'Размер взноса на капитальный ремонт',
                breadcrumbs: [
                    {
                        url: '#!',
                        label: 'Главная страница'
                    },
                    {
                        label: 'Размер взноса на капитальный ремонт'
                    }
                ]
            }
        });
    }
})(angular);

(function (angular) {'use strict';
    config.$inject = ["$stateProvider"];
    angular.module('pafo-common-web-package')
        .config(config);

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider.state('public-statistic-wdgt-contribution-size', {
            url: '/wdgt-contribution-size',
            views: {
                content: {
                    templateUrl: 'wdgt-contribution-size/wdgt-contribution-size.tpl.html',
                    controller: 'publicStatisticWdgtContributionSizeCtrl',
                    controllerAs: 'vm'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: 'Размер взноса на капитальный ремонт',
                breadcrumbs: [
                    {
                        url: '#!',
                        label: 'Главная страница'
                    },
                    {
                        label: 'Размер взноса на капитальный ремонт'
                    }
                ]
            }
        });
    }
})(angular);

(function (angular) {'use strict';
    config.$inject = ["$stateProvider"];
    angular.module('pafo-common-web-package')
        .config(config);

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider.state('public-statistic-wdgt-mkd-control-method', {
            url: '/wdgt-mkd-control-method',
            views: {
                content: {
                    templateUrl: 'wdgt-mkd-control-method/wdgt-mkd-control-method.tpl.html',
                    controller: 'publicStatisticWdgtMkdControlMethodCtrl',
                    controllerAs: 'vm'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: 'Распределение многоквартирных домов по способам управления',
                breadcrumbs: [
                    {
                        url: '#!',
                        label: 'Главная страница'
                    },
                    {
                        label: 'Распределение многоквартирных домов по способам управления'
                    }
                ]
            }
        });
    }
})(angular);

(function (angular) {'use strict';
    config.$inject = ["$stateProvider"];
    angular.module('pafo-common-web-package')
        .config(config);

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider.state('public-statistic-wdgt-municipal-services-charge', {
            url: '/wdgt-municipal-services-charge',
            views: {
                content: {
                    templateUrl: 'wdgt-municipal-services-charge/wdgt-municipal-services-charge.tpl.html',
                    controller: 'publicStatisticWdgtMunicipalServicesChargeCtrl',
                    controllerAs: 'vm'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: 'Средний размер начислений за коммунальные услуги',
                breadcrumbs: [
                    {
                        url: '#!',
                        label: 'Главная страница'
                    },
                    {
                        label: 'Средний размер начислений за коммунальные услуги'
                    }
                ]
            }
        });
    }
})(angular);

(function (angular) {'use strict';
    config.$inject = ["$stateProvider"];
    angular.module('pafo-common-web-package')
        .config(config);

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider.state('public-statistic-wdgt-municipal-services-debt', {
            url: '/wdgt-municipal-services-debt',
            views: {
                content: {
                    templateUrl: 'wdgt-municipal-services-debt/wdgt-municipal-services-debt.tpl.html',
                    controller: 'publicStatisticWdgtMunicipalServicesDebtCtrl',
                    controllerAs: 'vm'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: 'Размер задолженности по оплате ЖКУ',
                breadcrumbs: [
                    {
                        url: '#!',
                        label: 'Главная страница'
                    },
                    {
                        label: 'Размер задолженности по оплате ЖКУ'
                    }
                ]
            }
        });
    }
})(angular);

(function (angular) {'use strict';
    config.$inject = ["$stateProvider"];
    angular.module('pafo-common-web-package')
        .config(config);

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider.state('public-statistic-wdgt-municipal-services-normative', {
            url: '/wdgt-municipal-services-normative',
            views: {
                content: {
                    templateUrl: 'wdgt-municipal-services-normative/wdgt-municipal-services-normative.tpl.html',
                    controller: 'publicStatisticWdgtMunicipalServicesNormativeCtrl',
                    controllerAs: 'vm'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: 'Нормативы потребления коммунальных услуг в жилых помещениях, ' +
                    'установленные органами государственной власти',
                breadcrumbs: [
                    {
                        url: '#!',
                        label: 'Главная страница'
                    },
                    {
                        label: 'Нормативы потребления коммунальных услуг'
                    }
                ]
            }
        });
    }
})(angular);

(function (angular) {'use strict';
    config.$inject = ["$stateProvider"];
    angular.module('pafo-common-web-package')
        .config(config);

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider.state('public-statistic-wdgt-municipal-services-payment', {
            url: '/wdgt-municipal-services-payment',
            views: {
                content: {
                    templateUrl: 'wdgt-municipal-services-payment/wdgt-municipal-services-payment.tpl.html',
                    controller: 'publicStatisticWdgtMunicipalServicesPaymentCtrl',
                    controllerAs: 'vm'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: 'Средняя сумма платы за жилое помещение и коммунальные услуги',
                breadcrumbs: [
                    {
                        url: '#!',
                        label: 'Главная страница'
                    },
                    {
                        label: 'Средняя сумма платы за жилое помещение и коммунальные услуги'
                    }
                ]
            }
        });
    }
})(angular);

(function (angular) {'use strict';
    config.$inject = ["$stateProvider"];
    angular.module('pafo-common-web-package')
        .config(config);

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider
            .state('public-statistic-wdgt-municipal-services-tariff', {
                url: '/wdgt-municipal-services-tariff',
                views: {
                    content: {
                        templateUrl: 'wdgt-municipal-services-tariff/wdgt-municipal-services-tariff.tpl.html',
                        controller: 'publicStatisticWdgtMunicipalServicesTariffCtrl',
                        controllerAs: 'vm'
                    }
                },
                resolve: {
                    loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
                },
                data: {
                    pageTitle: 'Тарифы (цены) на коммунальные ресурсы, установленные органами государственной власти' +
                        ' в сфере регулирования тарифов',
                    breadcrumbs: [
                        {
                            url: '#!',
                            label: 'Главная страница'
                        },
                        {
                            label: 'Установленные тарифы на коммунальные ресурсы'
                        }
                    ]
                }
            });
    }
})(angular);

(function (angular) {'use strict';
    config.$inject = ["$stateProvider"];
    angular.module('pafo-common-web-package')
        .config(config);

    /* @ngInject */
    function config($stateProvider) {
        $stateProvider.state('interactive-analytics-work-cost-analysis', {
            url: '/work-cost-analysis',
            views: {
                content: {
                    templateUrl: 'work-cost-analysis/work-cost-analysis.tpl.html',
                    controller: 'PublicStatisticWorkCostAnalysisCtrl',
                    controllerAs: 'vm'
                }
            },
            resolve: {
                loadModule: ["pafoCommonLazy", function (pafoCommonLazy) {return pafoCommonLazy();}]
            },
            data: {
                pageTitle: 'Анализ стоимости обслуживания общего имущества многоквартирного дома, текущего ремонта и аварийных работ',
                breadcrumbs: [
                    {
                        url: '#!',
                        label: 'Главная страница'
                    },
                    {
                        url: '',
                        label: 'Анализ стоимости обслуживания общего имущества многоквартирного дома, текущего ремонта и аварийных работ'
                    }
                ]
            }
        });
    }
})(angular);

angular.module('pafo-common-web-package')

    .constant('STAT_WIDG_HOUSE_MANAGEMENTS', [
        {id: 1, name: 'Непосредственное управление'},
        {id: 2, name: 'Управляющая организация'},
        {id: 3, name: 'ТСЖ, ЖСК, ЖК, иной кооператив'},
        {id: 4, name: 'Способ управления не выбран или не реализован'},
        {id: 5, name: 'Информация о способе управления не размещена в системе'}
    ])

    .constant('STAT_WIDG_COMMUNAL_RESOURCES', [
        {code: '1', name: "Холодная вода"},
        {code: '2', name: "Горячая вода"},
        {code: '3', name: "Электрическая энергия"},
        {code: '4', name: "Газ"},
        {code: '5', name: "Тепловая энергия"},
        {code: '8', name: "Сточные бытовые воды"}
    ])

    .constant('MAP_COLORS', {
        GRAY_COLOR: '#dfdfdf',
        GREY_COLOR: '#e5eaee',
        GREEN_COLOR: '#add364',
        YELLOW_COLOR: '#fbec69',
        ORANGE_COLOR: '#fcb95c',
        RED_COLOR: '#f47a5d',
        BLUE_COLOR: '#bae3f2',
        VIOLET_COLOR: '#ac8dc1'
    });
