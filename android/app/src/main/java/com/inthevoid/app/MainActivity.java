package com.inthevoid.app;

import android.annotation.SuppressLint;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends AppCompatActivity {
    private static final String START_URL = "https://appassets.androidplatform.net/assets/app/index.html";
    private WebView webView;
    private WebViewAssetLoader assetLoader;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureSystemBars();

        assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView = new WebView(this);
        setContentView(webView);
        configureWebView();
        configureServiceWorker();

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(START_URL);
        }
    }

    private void configureSystemBars() {
        Window window = getWindow();
        window.setNavigationBarColor(Color.BLACK);
        window.setStatusBarColor(Color.BLACK);
        if (android.os.Build.VERSION.SDK_INT >= 26) {
            int flags = window.getDecorView().getSystemUiVisibility();
            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            window.getDecorView().setSystemUiVisibility(flags);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setSupportZoom(true);
        s.setLoadsImagesAutomatically(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        if (android.os.Build.VERSION.SDK_INT >= 26) {
            s.setSafeBrowsingEnabled(true);
        }

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setBackgroundColor(Color.WHITE);
        webView.setWebViewClient(new LocalContentWebViewClient());
    }

    private void configureServiceWorker() {
        if (android.os.Build.VERSION.SDK_INT >= 24) {
            ServiceWorkerController controller = ServiceWorkerController.getInstance();
            controller.setServiceWorkerClient(new ServiceWorkerClient() {
                @Override
                public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                    return assetLoader.shouldInterceptRequest(request.getUrl());
                }
            });
        }
    }

    private class LocalContentWebViewClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            WebResourceResponse local = assetLoader.shouldInterceptRequest(request.getUrl());
            return local != null ? local : super.shouldInterceptRequest(view, request);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            String host = uri.getHost();
            if (host == null) return false;
            if ("appassets.androidplatform.net".equalsIgnoreCase(host)) return false;

            String url = uri.toString();
            if (url.startsWith("https://") || url.startsWith("http://")) {
                view.loadUrl(url);
                return true;
            }
            return false;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        configureSystemBars();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }
}
