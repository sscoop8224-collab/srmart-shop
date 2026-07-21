package com.dongshin.srmart;

import android.Manifest;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {

    private static final int CAMERA_PERMISSION_REQUEST = 1001;
    private PermissionRequest pendingPermissionRequest;
    // Android 12 로고 스플래시 유지 플래그. 광고가 준비되면(JS SrmartNav.releaseSplash) false → 즉시 종료.
    private static volatile boolean sSplashHold = true;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 로고 스플래시를 광고 준비 시점까지 유지하고, 종료는 '애니메이션 없이 즉시 제거'해 초록 종료애니 노출을 막는다.
        // (capacitor SplashScreen 플러그인은 launchShowDuration:0이라 런치 스플래시를 제어하지 않음 → 여기서 직접 제어.)
        androidx.core.splashscreen.SplashScreen splash = androidx.core.splashscreen.SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        splash.setKeepOnScreenCondition(() -> sSplashHold);
        // 종료: 시스템 기본 애니(초록 노출) 대신, 이미 그려진 광고 '위로' 스플래시를 빠르게 페이드아웃.
        // → 초록 갭 없이 부드럽게 광고로 전환(하드컷 느낌·웹뷰 첫프레임 스케일 노이즈 완화).
        splash.setOnExitAnimationListener(provider -> {
            final View v = provider.getView();
            v.animate().alpha(0f).setDuration(220)
                .withEndAction(provider::remove).start();
        });
        // 안전망: release 신호가 안 와도 3.5초 뒤 강제 해제(로고에 갇히지 않게).
        new android.os.Handler(getMainLooper()).postDelayed(() -> sSplashHold = false, 3500);

        WebView webView = getBridge().getWebView();

        // ✅ 한글 IME 입력 활성화
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);

        // ✅ 웹뷰 설정
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);

        // 하단 내비바 런타임 전환 브리지 — 웹 로드 완료(App.js hideSplash) 시 JS가 호출.
        // 로딩 구간=theme의 초록 내비바 유지 → 로드 후=흰 배경 + 어두운 아이콘(밝은 shop 콘텐츠에 맞춤).
        // 노출 메서드는 시스템 바 색 변경 하나뿐(민감 동작 없음), 원격은 자체 HTTPS 도메인.
        webView.addJavascriptInterface(new NavBarBridge(), "SrmartNav");

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                pendingPermissionRequest = request;
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                        == PackageManager.PERMISSION_GRANTED) {
                    request.grant(request.getResources());
                } else {
                    ActivityCompat.requestPermissions(
                        MainActivity.this,
                        new String[]{ Manifest.permission.CAMERA },
                        CAMERA_PERMISSION_REQUEST
                    );
                }
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CAMERA_PERMISSION_REQUEST) {
            if (pendingPermissionRequest != null) {
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    pendingPermissionRequest.grant(pendingPermissionRequest.getResources());
                } else {
                    pendingPermissionRequest.deny();
                }
                pendingPermissionRequest = null;
            }
        }
    }

    // 웹 로드 완료 시 JS(window.SrmartNav.onContentReady())가 호출 → 하단 내비바를 콘텐츠용으로 전환.
    private class NavBarBridge {
        // 광고 준비 완료 → 로고 스플래시 즉시 종료(초록 종료애니 없이 광고로 바로).
        @JavascriptInterface
        public void releaseSplash() { sSplashHold = false; }

        @JavascriptInterface
        public void onContentReady() {
            runOnUiThread(() -> {
                Window w = getWindow();
                w.setNavigationBarColor(Color.WHITE);   // 흰 배경
                View decor = w.getDecorView();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    WindowInsetsController c = w.getInsetsController();
                    if (c != null) {
                        // 어두운 아이콘(밝은 내비바)
                        c.setSystemBarsAppearance(
                            WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                            WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
                    }
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    decor.setSystemUiVisibility(
                        decor.getSystemUiVisibility() | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
                }
            });
        }
    }
}
