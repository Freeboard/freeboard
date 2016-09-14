netpie-freeboard
==========

Freeboard ที่มาพร้อม NETPIE datasource and widget plugins

![2016-06-24_20-58-53](https://cloud.githubusercontent.com/assets/7685964/16339834/fd5f2fe4-3a4e-11e6-8af5-05a358444507.jpg)

วิธีติดตั้ง

git clone https://github.com/netpieio/netpie-freeboard

การใช้งาน ใช้ browser เปิดไฟล์ index.html  ในส่วนของ DATASOURCES คลิก ADD เลือก TYPE เป็น NETPIE Microgear ปรับแต่งค่าตามความเหมาะสม
NAME - ชื่อของ datasource

- **APP ID** - App ID ของ NETPIE
- **KEY** - Key ของ microgear
- **SECRET - Secret** ของ key ข้างต้น
- **DEVICE ALIAS** - ถ้าต้องการ อาจตั้งชื่อให้ datasource อันนี้ เพื่อที่ thing อื่นจะสามารถ chat มาถึงได้
- **MICROGEAR REFERENCE** - เอาไว้ใช้อ้างอิงถึง microgear ของ datasource นี้ เวลาที่จะเขียนโค้ด Javascript หากตั้งค่านี้เป็น mygear รูปแบบการอ้างอิงจะเป็น microgear['mygear']
- **SUBSCRIBE TOPICS** - เป็น topic ที่จะให้ datasource นี้ subscribe หากมีหลาย topic ให้ใช้ comma คั่น สามารถใช้ wildcard # และ + ได้ ค่าปกติจะเป็น /# คือ subscribe ทุก topic ของ App ID นี้

![netpie-freeboard2](https://cloud.githubusercontent.com/assets/7685964/15654634/fbe3c096-26bf-11e6-8ab5-4656839b53ad.jpg)

ในส่วนของ button widget เราสามารถปรับแต่งให้ปุ่ม มีการรันโค้ด Javascript เมื่อเกิดการกดได้ ตามตัวอย่างในรูป ปุ่มจะถูกกำหนดให้ส่ง chat message ไปยัง thing ที่ชื่อ pieslampher ทุกครั้งที่ถูกกด 
โดยที่ index 'mg1' คือ microgear reference ของ datasource netpie1 ที่เราได้กำหนดไว้ตอนสร้าง datasource

![netpie-freeboard3](https://cloud.githubusercontent.com/assets/7685964/15655823/ec23a1f2-26ca-11e6-9968-ee500136b7bc.jpg)
