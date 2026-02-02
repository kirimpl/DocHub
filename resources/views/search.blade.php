@extends('layouts.app')

@section('content')
<div class="search-page">
    <div class="search-header-card">
        <div class="search-heading">
            <div class="search-title">
                <h2>Поиск по запросу: <span id="searchQueryLabel">—</span></h2>
                <p id="searchMeta">Введите запрос в поиск.</p>
            </div>
            <div class="search-tabs" role="tablist">
                <button class="search-tab active" data-tab="posts" type="button">Посты</button>
                <button class="search-tab" data-tab="users" type="button">Люди</button>
                <button class="search-tab" data-tab="lectures" type="button">Лекции</button>
            </div>
        </div>
    </div>

    <div class="search-results">
        <section class="search-section active" data-section="posts">
            <div class="search-section-title">Посты</div>
            <div class="search-list" id="searchPosts"></div>
        </section>

        <section class="search-section" data-section="users">
            <div class="search-section-title">Люди</div>
            <div class="search-list" id="searchUsers"></div>
        </section>

        <section class="search-section" data-section="lectures">
            <div class="search-section-title">Лекции</div>
            <div class="search-list" id="searchLectures"></div>
        </section>
    </div>
</div>
@endsection
