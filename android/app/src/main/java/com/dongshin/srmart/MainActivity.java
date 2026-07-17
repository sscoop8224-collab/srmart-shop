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

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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
