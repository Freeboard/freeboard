<?php

class RTCLib {

	private $LOGIN_USER='lihliang@cn.ibm.com';
	private $LOGIN_PASS='@#$%sdfg';

	private $CONSTANT = array();

	// private $cookie_file = "/data/".'cookies.txt';
	private $cookie_file = "/Users/samuel.li/Documents/projects/dashboard/freeboard/data/cookies.txt";
	// private $rtc_cache = "/data/".'cache.xml';
	private $rtc_cache = "/Users/samuel.li/Documents/projects/dashboard/freeboard/data/cache.xml";

	private $LOGINURL_1='https://swgjazz.ibm.com:8017/jazz/auth/authrequired';
	private $LOGINURL_2='https://swgjazz.ibm.com:8017/jazz/auth/j_security_check';
	private $COOKIEs = '';

	public function __construct() {
		$this->CONSTANT['environment'] = array(
			"environment.literal.l2" => "Production",
			"environment.literal.l31"  => "Production", //"mySA IA - PROD", 
			//"environment.literal.l32"  => "Ocean CIP"

		);
	}

	public function trace($log) {
		echo "[".date("Y-m-d H:i:s")."] TRACE :".$log."\n";
	}

	public function setXmlCacheFile($cache_file) {
		$this->rtc_cache = $cache_file;
	}

	public function getXmlCacheFile() {
		return $this->rtc_cache;
	}

	public function setCookieFile($cookie_file) {
		$this->cookie_file = $cookie_file;
	}

	public function getCookieFile() {
		return $this->cookie_file;
	}

	private  function getCookies() {
		return $this->COOKIEs;
	}

	public function auth() {
		$post4login = array("j_username"=>$this->LOGIN_USER, "j_password"=>$this->LOGIN_PASS);
		$this->COOKIEs = $this->get_cookie($this->LOGINURL_1, $this->cookie_file);
		$this->login($this->LOGINURL_2, $post4login, $this->COOKIEs, $this->cookie_file);
	}

	public function getFoundIn($env_key) {
		if (array_key_exists($env_key, $this->CONSTANT['environment'])) {
            return $this->CONSTANT['environment'][$env_key];
        }
        return "Others";
	}

	/**
	 * TODO : ERROR HANDLE
	 */
	private function get_cookie($url){
	        $httpHeader = array(
	            "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
	            "Accept-Encoding: gzip, deflate, br",
	            "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8",
	            "Connection: keep-alive",
	            "Cookie: net-jazz-ajax-cookie-rememberUserId=",
	            "Host: swgjazz.ibm.com:8017",
	            "Upgrade-Insecure-Requests: 1",
	            "user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36"
	        );

	        $ch = curl_init($url);

	        curl_setopt($ch,CURLOPT_HTTPHEADER,$httpHeader);
	        curl_setopt($ch, CURLOPT_HEADER,1);
	        curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_0);
	        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
	        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 0);
	        curl_setopt($ch, CURLOPT_HTTPGET, true);
	        //curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie_file); // Save cookie to $cookie_file
	        
	        //curl_setopt($ch, CURLOPT_COOKIEFILE, 'cookie.txt'); // The cookie file what we want to include in the request        
	        $content=curl_exec($ch);
	        
	        if(curl_errno($ch)){
	            echo 'Curl error: '.curl_error($ch);
	            exit(); 
	         }    
	            
	        if($content==false){
	            echo "get_content_null";
	            exit();
	        }
	        preg_match_all('/Set-Cookie:(.*);/iU',$content,$cookies);
	        $cookie = implode(";", $cookies[1]);
	        curl_close($ch);
	        
	        return  $cookie;
	}

	/**
	 * TODO : ERROR HANDLE
	 */
	private function login($login_url, $postBody, $cookie, $cookie_file='') {
	    $postBody = http_build_query($postBody);
	    $httpHeader = array(
	            "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
	            "Accept-Encoding: gzip, deflate, br",
	            "Accept-Language: en-US,en;q=0.9,en;q=0.8",
	            "Cache-Control: max-age=0",
	            "Connection: keep-alive",
	            "Content-Length: ".strlen($postBody),
	            "Content-Type: application/x-www-form-urlencoded",
	            "Cookie:".$cookie,
	            "Host: swgjazz.ibm.com:8017",
	            "Referer: https://swgjazz.ibm.com:8017/jazz/auth/authrequired",
	            "Upgrade-Insecure-Requests: 1",
	            "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36"
	        );
	    $curl = curl_init();
	    curl_setopt($curl, CURLOPT_URL, $login_url);
	    curl_setopt($curl, CURLOPT_COOKIEJAR, $cookie_file);
	    curl_setopt($curl, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
	    curl_setopt($curl, CURLOPT_HTTPHEADER, $httpHeader);
	    curl_setopt($curl, CURLOPT_POST, true);
	    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
	    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
	    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
	    curl_setopt($curl, CURLOPT_FOLLOWLOCATION, 0);
	    curl_setopt($curl, CURLOPT_POSTFIELDS, $postBody);

	    $response = curl_exec($curl);
	    // $err = curl_error($curl);
	    // $httpcode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
	    curl_close($curl);
	    // echo "post: ", $postBody, "\n";
	    // echo "ERRROR : ",$err,"\n";
	    // echo "HTTPCODE : ",$httpcode,"\n";
	    // echo "RESPONSE:", $response, "\n";
	    return $response;
	}

	/**
	 * TODO : ERROR HANDLE
	 */
	public function getRTCInfo($rtc_link, $save=false) {
	    $httpHeader = array(
	            "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
	            "Accept-Encoding: gzip, deflate, br",
	            "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8",
	            "Connection: keep-alive",
	            "Cookie: ".$this->getCookies(),
	            "Cookie: net-jazz-ajax-cookie-rememberUserId=",
	            "Host: swgjazz.ibm.com:8017",
	            "Upgrade-Insecure-Requests: 1",
	            "user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36"
	    );
	    $ch = curl_init($rtc_link);
	    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
	    curl_setopt($ch, CURLOPT_HTTPHEADER, $httpHeader);
	    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
	    curl_setopt($ch, CURLOPT_COOKIEFILE, $this->getCookieFile()); //使用上面获取的cookies
	    $response = curl_exec($ch);
	    // $err = curl_error($ch);
	    // $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	    curl_close($ch);
	    // echo "ERRROR : ",$err,"\n";
	    // echo "HTTPCODE : ",$httpcode,"\n";
	    // echo $response;
	    if ($save) {
	    	$this->saveXmlCache($response);
	    }
	    return $response;
	}

	public function isResolved($status) {
		if (in_array($status, array('Resolved','Verified','Archive'))) {
			return true;
		}
		return false;
	}

	public function getPriority($priority, $severity) {
		if ($severity == "Blocker") {
			return "Blocker";
		}
		if ($severity == "Critical" || $priority == "Critical" ) {
			return "Critical";
		}
		return "Normal";
	}

	public function saveXmlCache($xmlContent) {
		$fp = fopen($this->getXmlCacheFile(), "w");
		fputs($fp, $xmlContent);
		fclose($fp);
	}
}
