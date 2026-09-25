package com.tulsimart.app

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.CookieManager
import android.webkit.JsPromptResult
import android.webkit.JsResult
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.tulsimart.app.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var networkUtils: NetworkUtils
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    // File Upload Callback for WebChromeClient
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (filePathCallback == null) return@registerForActivityResult
        val uris = if (result.resultCode == RESULT_OK && result.data != null) {
            val dataString = result.data?.dataString
            if (dataString != null) arrayOf(Uri.parse(dataString)) else null
        } else {
            null
        }
        filePathCallback?.onReceiveValue(uris)
        filePathCallback = null
    }

    companion object {
        const val TARGET_URL = "https://tulsi-mart.vercel.app"
        const val API_BACKEND_URL = "https://tulsimart.onrender.com"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        networkUtils = NetworkUtils(this)

        setupWebView()
        setupSwipeRefresh()
        setupRetryButton()
        setupBackNavigation()
        observeNetworkState()

        if (networkUtils.isNetworkAvailable()) {
            loadWebsite()
        } else {
            showErrorState()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val webSettings = binding.webView.settings

        // Enable Core Capabilities for React SPA & Auth
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        webSettings.allowFileAccess = true
        webSettings.allowContentAccess = true

        // Viewport & Responsive Display
        webSettings.useWideViewPort = true
        webSettings.loadWithOverviewMode = true
        webSettings.setSupportZoom(true)
        webSettings.builtInZoomControls = false
        webSettings.displayZoomControls = false

        // Media & Performance Settings
        webSettings.mediaPlaybackRequiresUserGesture = false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        }

        // Custom App User-Agent
        val defaultUserAgent = webSettings.userAgentString
        webSettings.userAgentString = "$defaultUserAgent TulsiMartAndroidApp/1.0"

        // Cookie Manager for Session & Auth Persistence
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(binding.webView, true)
        }

        // WebView Client
        binding.webView.webViewClient = object : WebViewClient() {

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                return handleUrlNavigation(url)
            }

            @Suppress("DEPRECATION")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                return url?.let { handleUrlNavigation(it) } ?: false
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                if (networkUtils.isNetworkAvailable()) {
                    binding.topProgressBar.visibility = View.VISIBLE
                    binding.errorContainer.visibility = View.GONE
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                binding.topProgressBar.visibility = View.GONE
                binding.loadingContainer.visibility = View.GONE
                binding.swipeRefreshLayout.isRefreshing = false

                // Synchronize Cookies to disk for persistent login sessions
                CookieManager.getInstance().flush()
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                // Only act on errors for the main page load
                if (request?.isForMainFrame == true) {
                    showErrorState()
                }
            }

            @Suppress("DEPRECATION")
            override fun onReceivedError(
                view: WebView?,
                errorCode: Int,
                description: String?,
                failingUrl: String?
            ) {
                super.onReceivedError(view, errorCode, description, failingUrl)
                if (failingUrl == binding.webView.url || failingUrl == TARGET_URL) {
                    showErrorState()
                }
            }
        }

        // WebChromeClient for Progress, JS Dialogs, and File Uploads
        binding.webView.webChromeClient = object : WebChromeClient() {

            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                binding.topProgressBar.progress = newProgress
                if (newProgress >= 100) {
                    binding.topProgressBar.visibility = View.GONE
                    binding.loadingContainer.visibility = View.GONE
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                val intent = fileChooserParams?.createIntent()
                return try {
                    if (intent != null) {
                        fileChooserLauncher.launch(intent)
                        true
                    } else {
                        false
                    }
                } catch (e: ActivityNotFoundException) {
                    this@MainActivity.filePathCallback = null
                    Toast.makeText(this@MainActivity, "Cannot open file picker", Toast.LENGTH_SHORT).show()
                    false
                }
            }

            override fun onJsAlert(
                view: WebView?,
                url: String?,
                message: String?,
                result: JsResult?
            ): Boolean {
                MaterialAlertDialogBuilder(this@MainActivity)
                    .setTitle(R.string.app_name)
                    .setMessage(message ?: "")
                    .setPositiveButton(android.R.string.ok) { _, _ -> result?.confirm() }
                    .setOnCancelListener { result?.cancel() }
                    .setCancelable(false)
                    .show()
                return true
            }

            override fun onJsConfirm(
                view: WebView?,
                url: String?,
                message: String?,
                result: JsResult?
            ): Boolean {
                MaterialAlertDialogBuilder(this@MainActivity)
                    .setTitle(R.string.app_name)
                    .setMessage(message ?: "")
                    .setPositiveButton(android.R.string.ok) { _, _ -> result?.confirm() }
                    .setNegativeButton(android.R.string.cancel) { _, _ -> result?.cancel() }
                    .setOnCancelListener { result?.cancel() }
                    .setCancelable(false)
                    .show()
                return true
            }

            override fun onJsPrompt(
                view: WebView?,
                url: String?,
                message: String?,
                defaultValue: String?,
                result: JsPromptResult?
            ): Boolean {
                result?.cancel()
                return true
            }
        }
    }

    private fun handleUrlNavigation(url: String): Boolean {
        // Keep Tulsi Mart React app URLs inside the WebView
        if (url.startsWith(TARGET_URL) || url.startsWith("https://tulsi-mart") || url.contains("vercel.app")) {
            return false
        }

        // Open external links (WhatsApp, Phone, Email, External Maps/Payment) in Native Apps
        return try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            startActivity(intent)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    private fun loadWebsite() {
        binding.errorContainer.visibility = View.GONE
        binding.loadingContainer.visibility = View.VISIBLE
        binding.webView.visibility = View.VISIBLE
        binding.webView.loadUrl(TARGET_URL)
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefreshLayout.setColorSchemeResources(
            R.color.deep_teal,
            R.color.teal,
            R.color.mint_green
        )
        binding.swipeRefreshLayout.setOnRefreshListener {
            if (networkUtils.isNetworkAvailable()) {
                if (binding.errorContainer.visibility == View.VISIBLE) {
                    loadWebsite()
                } else {
                    binding.webView.reload()
                }
            } else {
                binding.swipeRefreshLayout.isRefreshing = false
                showErrorState()
            }
        }
    }

    private fun setupRetryButton() {
        binding.btnRetry.setOnClickListener {
            if (networkUtils.isNetworkAvailable()) {
                loadWebsite()
            } else {
                Toast.makeText(this, R.string.error_no_internet, Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    showExitConfirmationDialog()
                }
            }
        })
    }

    private fun showExitConfirmationDialog() {
        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.exit_dialog_title)
            .setMessage(R.string.exit_dialog_msg)
            .setPositiveButton(R.string.btn_exit) { _, _ ->
                finish()
            }
            .setNegativeButton(R.string.btn_cancel, null)
            .show()
    }

    private fun showErrorState() {
        binding.topProgressBar.visibility = View.GONE
        binding.loadingContainer.visibility = View.GONE
        binding.webView.visibility = View.GONE
        binding.errorContainer.visibility = View.VISIBLE
        binding.swipeRefreshLayout.isRefreshing = false
    }

    private fun observeNetworkState() {
        networkCallback = networkUtils.registerNetworkCallback(
            onNetworkAvailable = {
                runOnUiThread {
                    if (binding.errorContainer.visibility == View.VISIBLE) {
                        loadWebsite()
                    }
                }
            },
            onNetworkLost = {
                runOnUiThread {
                    if (binding.webView.url == null || binding.webView.visibility == View.GONE) {
                        showErrorState()
                    }
                }
            }
        )
    }

    override fun onDestroy() {
        networkCallback?.let { networkUtils.unregisterNetworkCallback(it) }
        binding.webView.destroy()
        super.onDestroy()
    }
}
