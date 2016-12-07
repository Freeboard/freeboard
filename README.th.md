netpie-freeboard
==========

Freeboard ที่มาพร้อม NETPIE datasource and widget plugins

![netpie-freeboard-screenshot](https://cloud.githubusercontent.com/assets/7685964/19427706/de8aab54-946f-11e6-81ae-bbe8b78910e5.jpg)


วิธีติดตั้ง

git clone https://github.com/netpieio/netpie-freeboard

การใช้งาน ใช้ browser เปิดไฟล์ index.html  ในส่วนของ DATASOURCES คลิก ADD เลือก TYPE เป็น NETPIE Microgear ปรับแต่งค่าตามความเหมาะสม

- **NAME** - ชื่อของ datasource ซึ่งแต่ละ NETPIE microgear datasource จะมี microgear object ที่เข้าถึงจาก script ได้ทาง microgear[*NAME*]  นอกจากนั้น ชื่อนี้ยังใช้เป็น microgear device alias ที่ device อื่นสามารถ chat มาหาได้ 
- **APP ID** - App ID ของ NETPIE
- **KEY** - Key ของ microgear
- **SECRET - Secret** ของ key ข้างต้น
- **SUBSCRIBE TOPICS** - เป็น topic ที่จะให้ datasource นี้ subscribe หากมีหลาย topic ให้ใช้ comma คั่น สามารถใช้ wildcard # และ + ได้ ค่าปกติจะเป็น /# คือ subscribe ทุก topic ของ App ID นี้

![netpie-freeboard2](https://cloud.githubusercontent.com/assets/7685964/15654634/fbe3c096-26bf-11e6-8ab5-4656839b53ad.jpg)

ในส่วนของ button widget เราสามารถปรับแต่งให้ปุ่ม มีการรันโค้ด Javascript เมื่อเกิดการกดได้ ตามตัวอย่างในรูป ปุ่มจะถูกกำหนดให้ส่ง chat message ไปยัง thing ที่ชื่อ pieslampher ทุกครั้งที่ถูกกด 
โดยที่ index 'mg1' คือ microgear reference ของ datasource netpie1 ที่เราได้กำหนดไว้ตอนสร้าง datasource

![netpie-freeboard3](https://cloud.githubusercontent.com/assets/7685964/15655823/ec23a1f2-26ca-11e6-9968-ee500136b7bc.jpg)
