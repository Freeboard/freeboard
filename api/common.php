<?php


class common {

	var $data_dir, $data_file, $data_path;
	function __construct($data_dir="/data/") {
		$this->data_dir = $data_dir;
		$this->data_file = "info.json";
		$this->data_path = "";
	}

	function check_env() {
		if (!file_exists($this->data_dir)) {
			return false;
		}
		return true;
	}

	function get_data_dir_by_name($name) {
		$host_dir = hash("crc32", $name, false);
		return $host_dir;
	}

	function set_data_dir($host_dir) {
		$this->data_path = $this->data_dir.$host_dir;
	}

	function create_data_dir($host_dir) {
		if (!file_exists($this->data_dir.$host_dir)) {
			if (!mkdir($this->data_dir.$host_dir)) {
				return false;
			}
		}
		$this->data_path = $this->data_dir.$host_dir;
		return true;
	}

	function write_info($info) {
		$fp = @fopen($this->data_path."/".$this->data_file, "w");
		if ($fp) {
			fwrite($fp, $info);
			fclose($fp);
			copy($this->data_path."/".$this->data_file, $this->data_path."/".time());
			return true;
		}
		return false;
	}

	function get_info() {
		if (!file_exists($this->data_path."/".$this->data_file)) {
			return false;
		}
		$fp = @fopen($this->data_path."/".$this->data_file, "r");
		if (!$fp) {
			return false;
		}
		$message = fgets($fp);
		fclose($fp);
		return $message;
	}
}