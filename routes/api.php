<?php

use App\Http\Middleware\RejectBannedUser;
use Illuminate\Support\Facades\Route;

Route::any('', 'HomeController@apiRoot');

Route::get('site-config', 'HomeController@siteConfig')->name('api.site-config');
Route::get('i18n/{locale}', 'HomeController@i18n')->name('api.i18n');

Route::get('health', fn () => response()->json(['status' => 'ok', 'timestamp' => now()]));

Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('login', 'AuthController@handleLogin');
    Route::post('register', 'AuthController@handleRegister');
    Route::post('forgot', 'AuthController@handleForgot');
    Route::post('reset/{uid}', 'AuthController@handleReset');
    Route::post('logout', 'AuthController@logout')->middleware('auth:web,oauth');
    Route::any('captcha', 'AuthController@captcha');
});

// Skinlib public routes
Route::prefix('skinlib')->group(function () {
    Route::get('list', 'SkinlibController@library');
    Route::get('info/{texture}', 'SkinlibController@info');
});

// Texture upload and management
Route::prefix('texture')->group(function () {
    Route::get('{texture}', 'SkinlibController@info');

    Route::middleware(['auth:web,oauth', RejectBannedUser::class, 'verified'])->group(function () {
        Route::post('', 'SkinlibController@handleUpload');
        Route::put('{texture}/name', 'SkinlibController@rename');
        Route::put('{texture}/type', 'SkinlibController@type');
        Route::put('{texture}/privacy', 'SkinlibController@privacy');
        Route::delete('{texture}', 'SkinlibController@delete');
    });
});

// Reports
Route::middleware(['auth:web,oauth', RejectBannedUser::class, 'verified'])->group(function () {
    Route::post('reports', 'ReportController@submit');
});

Route::prefix('user')->middleware(['auth:web,oauth', RejectBannedUser::class])->group(function () {
    Route::get('', 'UserController@user')->middleware(['scope:User.Read']);

    Route::middleware(['scope:Notification.Read'])->group(function () {
        Route::get('notifications', 'NotificationsController@all');
        Route::post('notifications/{id}', 'NotificationsController@read');
    });

    // User profile and account
    Route::get('score-info', 'UserController@scoreInfo');
    Route::post('sign', 'UserController@sign');
    Route::post('profile', 'UserController@handleProfile');
    Route::post('profile/avatar', 'UserController@setAvatar');
    Route::post('email-verification', 'UserController@sendVerificationEmail');
    Route::put('dark-mode', 'UserController@toggleDarkMode');

    // User reports
    Route::get('reports', 'ReportController@trackData');

    // Closet IDs
    Route::get('closet/ids', 'ClosetController@allIds');
});

Route::prefix('players')->middleware(['auth:web,oauth', RejectBannedUser::class])->group(function () {
    Route::get('', 'PlayerController@list')->middleware(['scope:Player.Read,Player.ReadWrite']);

    Route::middleware(['scope:Player.ReadWrite'])->group(function () {
        Route::post('', 'PlayerController@add');
        Route::delete('{player}', 'PlayerController@delete');
        Route::put('{player}/name', 'PlayerController@rename');
        Route::put('{player}/textures', 'PlayerController@setTexture');
        Route::delete('{player}/textures', 'PlayerController@clearTexture');
    });
});

Route::prefix('closet')->middleware(['auth:web,oauth', RejectBannedUser::class])->group(function () {
    Route::get('', 'ClosetController@getClosetData')->middleware(['scope:Closet.Read,Closet.ReadWrite']);

    Route::middleware(['scope:Closet.ReadWrite'])->group(function () {
        Route::post('', 'ClosetController@add');
        Route::put('{tid}', 'ClosetController@rename');
        Route::delete('{tid}', 'ClosetController@remove');
    });
});

Route::prefix('admin')
    ->middleware(['auth:web,oauth', RejectBannedUser::class, 'role:admin'])
    ->group(function () {
        Route::get('chart', 'AdminController@chartData');
        Route::get('dashboard', 'AdminController@dashboardData');
        Route::get('status', 'AdminController@statusData');

        Route::prefix('users')->group(function () {
            Route::get('', 'UsersManagementController@list')->name('list')->middleware(['scope:UsersManagement.Read,UsersManagement.ReadWrite']);
            Route::prefix('{user}')->middleware(['scope:UsersManagement.ReadWrite'])->group(function () {
                Route::put('email', 'UsersManagementController@email')->name('email');
                Route::put('verification', 'UsersManagementController@verification')->name('verification');
                Route::put('nickname', 'UsersManagementController@nickname')->name('nickname');
                Route::put('password', 'UsersManagementController@password')->name('password');
                Route::put('score', 'UsersManagementController@score')->name('score');
                Route::put('permission', 'UsersManagementController@permission')->name('permission');
                Route::delete('', 'UsersManagementController@delete')->name('delete');
            });
        });

        Route::prefix('players')->group(function () {
            Route::get('', 'PlayersManagementController@list')->middleware(['scope:PlayersManagement.Read,PlayersManagement.ReadWrite']);

            Route::middleware(['scope:PlayersManagement.ReadWrite'])->group(function () {
                Route::put('{player}/name', 'PlayersManagementController@name');
                Route::put('{player}/owner', 'PlayersManagementController@owner');
                Route::put('{player}/textures', 'PlayersManagementController@texture');
                Route::delete('{player}', 'PlayersManagementController@delete');
            });
        });

        Route::prefix('closet')->group(function () {
            Route::get('{user}', 'ClosetManagementController@list')->middleware(['scope:ClosetManagement.Read,ClosetManagement.ReadWrite']);
            Route::middleware(['scope:ClosetManagement.ReadWrite'])->group(function () {
                Route::post('{user}', 'ClosetManagementController@add');
                Route::delete('{user}', 'ClosetManagementController@remove');
            });
        });

        Route::prefix('reports')->group(function () {
            Route::get('', 'ReportController@manage')->middleware(['scope:ReportsManagement.Read,ReportsManagement.ReadWrite']);
            Route::put('{report}', 'ReportController@review')->middleware(['scope:ReportsManagement.ReadWrite']);
        });

        Route::post('notifications', 'NotificationsController@send')->middleware(['scope:Notification.ReadWrite']);

        // Translations
        Route::prefix('i18n')->group(function () {
            Route::get('list', 'TranslationsController@list');
            Route::post('', 'TranslationsController@create');
            Route::put('{line}', 'TranslationsController@update');
            Route::delete('{line}', 'TranslationsController@delete');
        });

        // Plugins
        Route::prefix('plugins')->group(function () {
            Route::get('data', 'PluginController@getPluginData');
            Route::post('manage', 'PluginController@manage');

            Route::middleware('role:super-admin')->group(function () {
                Route::post('upload', 'PluginController@upload');
                Route::post('wget', 'PluginController@wget');
            });

            Route::prefix('market')->group(function () {
                Route::get('list', 'MarketController@marketData');
                Route::post('download', 'MarketController@download');
            });
        });

        // Update
        Route::prefix('update')->middleware('role:super-admin')->group(function () {
            Route::get('', 'UpdateController@checkUpdate');
            Route::post('download', 'UpdateController@download');
        });

        // Options
        Route::prefix('options')->group(function () {
            Route::get('customize', 'Api\OptionsController@customize');
            Route::post('customize', 'Api\OptionsController@saveCustomize');
            Route::get('score', 'Api\OptionsController@score');
            Route::post('score', 'Api\OptionsController@saveScore');
            Route::get('general', 'Api\OptionsController@general');
            Route::post('general', 'Api\OptionsController@saveGeneral');
            Route::get('resource', 'Api\OptionsController@resource');
            Route::post('resource', 'Api\OptionsController@saveResource');
            Route::post('resource/clear-cache', 'Api\OptionsController@clearCache');
        });
    });
