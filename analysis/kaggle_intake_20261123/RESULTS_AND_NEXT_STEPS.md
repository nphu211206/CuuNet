# Kết quả Việt Nam đã kiểm toán ngày 23 tháng 11 năm 2026

Ba ZIP gốc được giữ nguyên trong `paper_submission/kaggle_results`. Bản giải nén phục vụ kiểm toán nằm trong thư mục này. Không cần huấn luyện lại ba vùng Việt Nam.

## Kiểm tra hoàn tất

- 45 mô hình: ba biến thể × năm seed × ba vùng. Mỗi vùng có 1.461 ngày test 2021–2024 và 1.096 ngày validation 2018–2020.
- Kiểm toán forecasting: 685.098 checks, không có thất bại; dự báo theo ngày, metric, input/source/artifact hash và chọn seed theo validation được đối chiếu.
- Kiểm toán outage: 1.482 checks, không có thất bại; mỗi vùng 13.728 dự báo trên 208 origins, 66 hàng metric và đủ hạn 1/3/7 ngày. Kiểm toán này kiểm tra metadata cutoff, nguồn target, checksum mô hình và tính lại lỗi; không chạy lại TensorFlow.
- FP32 TensorFlow.js và uint8 weight storage đều có kết quả đối chiếu số. Chưa có phép đo trình duyệt/điện thoại hoặc pin.
- Thời gian thực trong manifest: primary khoảng 120–121 phút/vùng; outage thêm khoảng 10 phút/vùng. Không suy ra thời gian Iowa từ số này.

## Forecast test trong đơn vị mm/ngày

Các hàng neural là mean ± sample SD trên năm seed; các baseline xác định không có seed SD. Đây là runoff generation reanalysis của ERA5-Land, không phải lưu lượng dòng sông, mực nước đo trạm hoặc flood-event truth.

| Vùng | Mô hình | MAE | RMSE | Peak MAE |
|---|---|---:|---:|---:|
| Bao_Ha_Runoff | Persistence | 1.455 | 4.353 | 7.288 |
| Bao_Ha_Runoff | MA 7 ngày | 1.901 | 4.860 | 8.440 |
| Bao_Ha_Runoff | Seasonal decomposition | 2.906 | 6.531 | 10.205 |
| Bao_Ha_Runoff | Expected-MSE ensemble | 1.976 | 4.757 | 8.220 |
| Bao_Ha_Runoff | LSTM không attention | 1.703 ± 0.217 | 4.036 ± 0.031 | 6.148 ± 0.313 |
| Bao_Ha_Runoff | TA-LSTM | 1.833 ± 0.197 | 4.055 ± 0.100 | 5.945 ± 0.188 |
| Bao_Ha_Runoff | TA-LSTM censored-input | 1.660 ± 0.119 | 4.052 ± 0.235 | 6.232 ± 0.233 |
| Gianh_Runoff | Persistence | 1.807 | 8.578 | 9.818 |
| Gianh_Runoff | MA 7 ngày | 2.175 | 8.543 | 12.380 |
| Gianh_Runoff | Seasonal decomposition | 3.436 | 11.660 | 12.992 |
| Gianh_Runoff | Expected-MSE ensemble | 2.387 | 8.141 | 10.678 |
| Gianh_Runoff | LSTM không attention | 1.836 ± 0.045 | 7.322 ± 0.073 | 8.499 ± 0.075 |
| Gianh_Runoff | TA-LSTM | 1.861 ± 0.013 | 7.365 ± 0.026 | 8.524 ± 0.039 |
| Gianh_Runoff | TA-LSTM censored-input | 1.925 ± 0.073 | 7.735 ± 0.197 | 8.705 ± 0.085 |
| Can_Tho_Runoff | Persistence | 1.118 | 3.041 | 4.151 |
| Can_Tho_Runoff | MA 7 ngày | 1.114 | 2.577 | 3.696 |
| Can_Tho_Runoff | Seasonal decomposition | 1.745 | 3.526 | 4.659 |
| Can_Tho_Runoff | Expected-MSE ensemble | 1.130 | 2.545 | 3.580 |
| Can_Tho_Runoff | LSTM không attention | 1.364 ± 0.099 | 2.525 ± 0.025 | 3.142 ± 0.076 |
| Can_Tho_Runoff | TA-LSTM | 1.412 ± 0.209 | 2.551 ± 0.056 | 3.171 ± 0.161 |
| Can_Tho_Runoff | TA-LSTM censored-input | 1.351 ± 0.252 | 2.579 ± 0.059 | 3.331 ± 0.206 |

## Diễn giải cần giữ trong bài

1. Persistence có MAE thấp hơn cả ba biến thể neural tại Bao Hà và Gianh; MA 7 ngày có MAE thấp nhất tại Cần Thơ. Không được đưa một tuyên bố neural/ensemble thắng mọi baseline.
2. LSTM không attention có RMSE và peak MAE thấp hơn persistence tại cả ba vùng. Attention không mang lại cải thiện MAE nhất quán; phải báo cáo ablation âm này.
3. Expected-MSE ensemble giảm lỗi so với seasonal decomposition ở cả ba vùng, nhưng vẫn không thắng baseline đơn giản tốt nhất về MAE. Tiêu chí tối ưu MSE và MAE xếp hạng cần được mô tả riêng.
4. Huấn luyện với censored recent inputs có ích khi đầu vào bị giữ cố định nhiều ngày. Đây là bằng chứng trực tiếp cho robustness trước dữ liệu cũ trong mô phỏng, không phải chứng minh dự báo cảnh báo ngoài hiện trường.

## Kết quả 7 ngày giữ cố định đầu vào

| Vùng | TA thường MAE | TA censored MAE | Giảm so với TA thường | ΔMAE censored − persistence [95% CI] |
|---|---:|---:|---:|---|
| Bao_Ha_Runoff | 4.628 | 1.802 | 61.1% | -0.127 [-0.597, 0.252] |
| Gianh_Runoff | 4.864 | 1.944 | 60.0% | -0.079 [-0.909, 0.483] |
| Can_Tho_Runoff | 1.908 | 1.404 | 26.4% | 0.062 [-0.160, 0.273] |

Các interval cho censored − TA thường đều dưới zero ở hạn 7 ngày. Cả ba interval cho censored − persistence chứa zero; không khẳng định superiority với persistence. Đây là paired circular block bootstrap 2.000 samples, blocks 5 outage origins, trên mean loss của năm mô hình đã train. Seed SD và uncertainty theo thời gian là hai thông tin khác nhau. Các hạn có cùng origins nhưng target dates khác; không suy ra đường lỗi theo hạn phải tăng đơn điệu.

## Mô hình trình duyệt

Đã tạo `paper_submission/browser_model_bundles_20261123/CuuNet_browser_<ZONE>.zip`: mỗi ZIP chứa selected censored-input TA-LSTM, bản FP32 và uint8-storage, preprocessing và 64 case đầu test. Seed được chọn theo validation. Model JSON/shards và manifest hash đã kiểm tra. Subset 64 case chỉ dùng đo thực thi; accuracy chính vẫn dùng đủ 1.461 ngày test.

FP32 graph có tổng dung lượng khoảng 2,426 MB; uint8-storage khoảng 0,744 MB (decimal). Đây là nén lưu trữ trọng số, không phải native integer-only inference. Mean absolute FP32-versus-uint8 prediction difference khoảng 0,0416–0,0814 mm/ngày. Các số này từ Node equivalence, không phải latency/memory của điện thoại.

## English result text ready for manuscript integration

The Vietnam experiments completed all 45 model fits across three regional supports and five seeds per architecture. Each test series contains 1,461 daily ERA5-Land runoff references from 2021 to 2024. Independent checks recalculated errors from saved per-date predictions and verified the recorded source and artifact hashes. Persistence or the seven-day moving average remained the strongest comparator on aggregate MAE, while recurrent models improved RMSE and high-runoff subset errors in several comparisons. Removing attention did not reduce performance consistently; the attention mechanism therefore cannot be presented as a general accuracy improvement.

For seven-day simulated input interruptions, mean MAE of ordinary temporal-attention LSTM was 4.628, 4.864 and 1.908 mm/day at Bao Ha, Gianh and Can Tho, respectively. The corresponding censored-input variant achieved 1.803, 1.944 and 1.404 mm/day, reductions of 61.1%, 60.0% and 26.4% against that specific neural comparator. Paired time-block intervals for the censored-minus-ordinary loss difference excluded zero in all three regions, conditional on the five fitted seeds. Its differences against persistence remained inconclusive, with all three intervals including zero. These results support training for stale physical inputs within the evaluated retrospective protocol, rather than general superiority over strong simple baselines.

## Trạng thái cập nhật ngày 23 tháng 11 năm 2026 (Hoàn tất Iowa & Trình duyệt)

- **Supplementary observed benchmark Iowa**: Đã hoàn tất đầy đủ cả ba trạm USGS (`USGS_05421000`, `USGS_05453520`, `USGS_06903900`) với 45 mô hình neural (15 mô hình/trạm) và toàn bộ các baseline xác định. Đã qua kiểm toán primary độc lập (96.287–98.067 checks mỗi trạm, 0 lỗi) và hoàn thành các kịch bản input outage. Cùng với 3 vùng Việt Nam, toàn bộ 6 lượt huấn luyện vật lý (90 neural model fits) đã đủ cho giao thức định sẵn; không cần thêm Kaggle run.
- **Demo trình duyệt & Ngoại tuyến**: Đã hoàn tất đo đạc tự động trên Headless Chrome desktop (12 nhóm cấu hình, 600 lượt đo warm latency, bộ nhớ tensor buffer xác định 2,16 MB). Đã cập nhật `public/research/sw.js` để giới hạn phạm vi xóa cache ở tiền tố `cuunet-research-*`. Đã kiểm toán độc lập quy trình ngoại tuyến: 3 báo cáo cộng đồng và model bundles lưu trữ trong IndexedDB (`cuunet-research-v1`) tồn tại nguyên vẹn qua hard reload trong điều kiện ngắt mạng 100%, thực thi suy luận ngoại tuyến thành công (`offline_reload_persistence_audit.json`). Toàn bộ tuyên bố mobile, tiết kiệm pin, hay triển khai thực địa đã được rút bỏ.
- **Tài liệu Response to Reviewers**: Đã cập nhật `paper_submission/HYDRO_D_26_00188_Response_to_Reviewers.docx` (các phản hồi R1 1, R1 4, R1 6, R1 8, R1 9, M1, M2, M4, A2, I3, I4 và Completion Checklist), chuyển các mục PENDING DATA VN, PENDING FCAST, PENDING OUTAGE, PENDING EDGE sang COMPLETED & BOUNDED.
- **Việc còn lại của tác giả trước khi nộp bài**: Xác nhận thông tin tác giả, kiểm tra CRediT/AI declaration lần cuối và chèn mã định danh release công khai (DOI/URL) cố định khi phát hành repository.
