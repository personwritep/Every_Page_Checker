// ==UserScript==
// @name        Every Page Checker
// @namespace        http://tampermonkey.net/
// @version        2.0
// @description        「記事の編集・削除」ページで「常設 styleタグ」をチェックする
// @author        Ameba Blog User
// @match        https://blog.ameba.jp/ucs/entry/srventrylist*
// @match        https://blog.ameba.jp/ucs/entry/srventryupdate*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=ameba.jp
// @run-at        document-start
// @grant        none
// @updateURL        https://github.com/personwritep/Every_Page_Checker/raw/main/Every_Page_Checker.user.js
// @downloadURL        https://github.com/personwritep/Every_Page_Checker/raw/main/Every_Page_Checker.user.js
// ==/UserScript==


window.addEventListener('DOMContentLoaded', function(){ // CSSデザインを適用
    let style=
        '<style>'+
        '#globalHeader, #ucsHeader, #ucsMainLeft h1, .l-ucs-sidemenu-area, .selection-bar { '+
        'display: none !important; } '+

        '#ucsContent { width: 930px !important; } '+
        '#ucsContent::before { display: none; } '+
        '#ucsMainLeft { width: 930px !important; padding: 0 15px !important; } '+
        '#sorting { margin: 0 0 4px; } '+
        '#sorting ul { display: none; } '+
        '</style>';

    document.head.insertAdjacentHTML('beforeend', style);

});



window.addEventListener('load', function(){ // 孫ウインドウで働く
    let body_id=document.body.getAttribute('id');
    if(body_id=="entryCreate"){ // 孫ウインドウ

        select_e(close_w);

        function select_e(close_w){
            let error_report=document.querySelector('h1.p-error__head');
            if(error_report==null){
                if(window.opener){
                    report('gray');
                    window.opener.close(); }} // エラー無い場合 grayを送信　子ウインドウを閉じる
            else{
                if(window.opener){
                    report('red');
                    window.opener.location.reload();
                }} // エラー報告のある場合は redを送信　子ウインドウを残す
            close_w(); }

        function close_w(){
            let close_button=document.querySelector('.entryComplete__close');
            close_button.click(); } // 孫ウインドウは常に閉じる

        function report(color){
            window.opener.document.querySelector('html').style.color=color; }}});



window.addEventListener('load', function(){ // 親ウインドウで働くメインスクリプト
    let type=0; // 動作タイプ

    let entry_target=document.querySelectorAll('.entry-item .entry');
    let entry_id=document.querySelectorAll('input[name="entry_id"]');
    let publish_f=document.querySelectorAll('input[name="publish_flg"]');
    let list_bar=document.querySelectorAll('#entryList .entry-item');
    let new_win=Array(entry_target.length);
    let link_target=Array(entry_target.length);


    let body_id=document.body.getAttribute('id');
    if(body_id=='entryListEdit'){
        let start_button=
            '<p id="type_ep">タグがあるウインドウを残す</p>'+
            '<p id="start_ep">Start</p>'+
            '<style>'+
            '#sorting { position: relative; } '+
            '#type_ep, #start_ep { position: absolute; top: 4px;font: bold 14px Meiryo; '+
            'width: auto; border: 1px solid #aaa; border-radius: 4px; '+
            'background: #fff; cursor: pointer; }'+
            '#type_ep { right: 90px; padding: 2px 15px 0; height: 20px; } '+
            '#start_ep { right: 15px; padding: 1px 15px 0; height: 21px; }'+
            '</style>';

        let sorting=document.querySelector('#sorting');
        if(sorting){
            sorting.insertAdjacentHTML('beforeend', start_button); }


        let type_ep=document.querySelector('#type_ep');
        if(type_ep){
            if(type==0){
                type_ep.textContent='タグがあるウインドウを残す'; }
            else{
                type_ep.textContent='タグがないウインドウを残す'; }

            type_ep.onclick=function(){ type_select(); };

            function type_select(){
                if(type==0){
                    type=1;
                    type_ep.textContent='タグがないウインドウを残す'; }
                else{
                    type=0;
                    type_ep.textContent='タグがあるウインドウを残す'; }}}


        let start_ep=document.querySelector('#start_ep');
        if(start_ep){
            start_ep.onclick=function(){ start_select(); };

            function start_select(){
                sorting.removeChild(start_ep);
                if(entry_target.length==0 || entry_target==null){ // 編集対象がリストに無い場合
                    alert('編集対象の記事がありません'); }
                if(entry_target.length >0){ // 編集対象がリストに有る場合
                    let ok=confirm('このページの検査対象記事：' + entry_target.length + '\n ⛔タグチェックを実行しますか？');
                    if(ok){ open_all(); }}}}

    } // if(body_id=='entryListEdit')


    function open_all(){
        open_win(0);
        if(entry_target.length>1){
            let k=1;
            let slow_open=setInterval( function(){
                open_win(k);
                k +=1;
                if(k>=entry_target.length){ clearInterval(slow_open); }}, 2400); }} // 2.4sec 間隔で自動実行 ⭕


    function open_win(k){
        link_target[k]='/ucs/entry/srventryupdateinput.do?id='+ entry_id[k].value;
        let top_p=100 + 30*k;
        new_win[k]=window.open(link_target[k], k, 'top=' + top_p + ', left=100, width=600, height=180');

        list_bar[k].style.boxShadow='inset 0 0 0 2px #03a9f4'; // リスト欄に青枠表示

        new_win[k].addEventListener('load', function(){
            setTimeout( function(){
                edit_target(publish_f[k].value, k); }, 500); });} // 子ウインドウでチェック開始


    function edit_target(val,k){
        let editor_flg=new_win[k].document.querySelector('input[name="editor_flg"]');

        if(editor_flg.value=='5'){ // 最新版エディタの文書の場合
            let editor_iframe=new_win[k].document.querySelector('.cke_wysiwyg_frame');
            let iframe_doc=editor_iframe.contentWindow.document;
            if(iframe_doc){
                let iframe_body=iframe_doc.querySelector('body.cke_editable');
                let style_tag=iframe_doc.querySelector('style.asa');

                if(style_tag){
                    if(type==0){ ; } // ウインドウを残す
                    else{
                        list_bar[k].style.boxShadow='none';
                        new_win[k].close(); }} // ウインドウを閉じる
                else{
                    if(type==0){
                        list_bar[k].style.boxShadow='none';
                        new_win[k].close(); } // ウインドウを閉じる
                    else{ ; }
                    list_bar[k].style.backgroundColor='#eceff1'; } // タグが無い場合　背景 淡グレー
            }}

        if(editor_flg.value=='1'){ // タグ編集エディタの文書の場合
            let preview=new_win[k].document.getElementById('js-light-preview');
            let tageditor_text=new_win[k].document.getElementById('entryTextArea');
            let style_tag=preview.querySelector('style.asa');

            if(style_tag){
                if(type==0){ ; } // 送信せずウインドウを残す
                else{
                    list_bar[k].style.boxShadow='none';
                    new_win[k].close(); }} // ウインドウを閉じる
            else{
                if(type==0){
                    list_bar[k].style.boxShadow='none';
                    new_win[k].close(); } // ウインドウを閉じる
                else{ ; }
                list_bar[k].style.backgroundColor='#eceff1'; }} // タグが無い場合　背景 淡グレー

    } // edit_target()

});
