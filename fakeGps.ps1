$a1 = '$52.461099646230515;30.95373939121498#'
$a2 = '$52.462099646230515;30.95373939121498#'
$a3 = '$52.463099646230515;30.95373939121498#'
$a4 = '$52.464099646230515;30.95373939121498#'
$a5 = '$52.465099646230515;30.95373939121498#'

$a6 = '$52.465099646230515;30.95473939121498#'
$a7 = '$52.465099646230515;30.95573939121498#'
$a8 = '$52.465099646230515;30.95673939121498#'
$a9 = '$52.465099646230515;30.95773939121498#'
$a10 = '$52.465099646230515;30.95873939121498#'

$a11 = '$52.464099646230515;30.95873939121498#'
$a12 = '$52.463099646230515;30.95873939121498#'
$a13 = '$52.462099646230515;30.95873939121498#'
$a14 = '$52.461099646230515;30.95873939121498#'
$a15 = '$52.460099646230515;30.95873939121498#'

$a16 = '$52.460099646230515;30.95773939121498#'
$a17 = '$52.460099646230515;30.95673939121498#'
$a18 = '$52.460099646230515;30.95573939121498#'
$a19 = '$52.460099646230515;30.95473939121498#'
$a20 = '$52.460099646230515;30.95373939121498#'


$array = $a1,$a2,$a3,$a4,$a5,$a6,$a7,$a8,$a9,$a10,$a11,$a12,$a13,$a14,$a15,$a16,$a17,$a18,$a19,$a20

$port= new-Object System.IO.Ports.SerialPort COM21,9600,None,8,one
$port.Open();
Foreach($i in $array)
{
    $port.WriteLine($i);
    Start-Sleep -m 100
}
$port.Close();