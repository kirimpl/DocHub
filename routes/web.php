<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('login');
});
Route::get('/news', function () {
    return view('home');
});
Route::get('/messenger', function () {
    return view('messenger');
});
Route::get('/messenger-new', function () {
    return view('messenger_new');
});
